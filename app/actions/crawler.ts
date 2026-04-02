"use server";

import * as cheerio from "cheerio";
import { currentUser } from "@clerk/nextjs/server";
import { after } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { preprocessDocument } from "@/lib/preprocessing";
import { getPineconeVectorStore } from "@/lib/vectorStore";
import { convexClient } from "@/lib/convex-http";
import { Id } from "@/convex/_generated/dataModel";

async function processUrlInBackground(
  url: string,
  content: string,
  namespace: string,
  documentId: Id<"documents">,
  userId: string,
  description: string
) {
  try {
    console.time("URL Processing");

    // 1. Chunking (We treat the URL content like a .txt file)
    const fileName = url.replace(/https?:\/\//, "").replace(/\//g, "-") + ".url";
    const fileBuffer = Buffer.from(content);

    const documents = await preprocessDocument(
      fileBuffer,
      fileName,
      namespace,
      documentId
    );

    // 2. Add Metadata
    const documentsWithId = documents.map((doc) => ({
      ...doc,
      metadata: {
        ...(doc.metadata || {}),
        documentId,
        userId,
        namespace,
        fileName,
        fileDescription: description,
        sourceUrl: url,
      },
    }));

    // 3. Upsert to Pinecone
    const vectorStore = await getPineconeVectorStore(namespace);
    await vectorStore.addDocuments(documentsWithId);

    // 4. Update Chunk Count in Convex via ConvexHttpClient (not fetchMutation).
    // ConvexHttpClient works without a session context, AND triggers realtime useQuery
    // subscriptions so the browser UI updates live without a page refresh.
    await convexClient.mutation(api.documents.updateChunkCount, {
      documentId,
      chunksCount: documents.length,
    });

    console.timeEnd("URL Processing");
  } catch (err) {
    console.warn("❌ Crawler Processing Error:", err);
    await convexClient.mutation(api.documents.updateDocumentStatus, {
      documentId,
      status: "failed",
    });
  }
}

export const crawlAndTrainUrl = async (
  url: string,
  namespace: string,
  description: string
) => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Authentication required" };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PluginBaseBot/1.0; +https://pluginbase.ai)",
      },
    });

    if (!response.ok) throw new Error(`Could not reach site: ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noisy elements
    $("script, style, nav, footer, iframe, noscript, svg, header").remove();

    // Get main content (prioritize <main> or <article>)
    let mainContent = $("main, article").text();

    if (!mainContent || mainContent.length < 200) {
      // Fallback to body if no main section found
      mainContent = $("body").text();
    }

    // Clean text
    const cleanText = mainContent
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    if (cleanText.length < 50) {
      throw new Error("Target page contains too little text content to be useful.");
    }

    const documentId = await fetchMutation(api.documents.saveDocument, {
      userId: user.id,
      fileName: url,
      fileSize: cleanText.length,
      fileType: "url",
      chunksCount: 0,
      namespace,
      fileDescription: description,
    });

    // Fire and forget background processing (using after() to ensure longevity)
    after(async () => {
      try {
        await processUrlInBackground(
          url,
          cleanText,
          namespace,
          documentId,
          user.id,
          description
        );
      } catch (err) {
        console.error("Crawler background processing error:", err);
      }
    });

    return { success: true, message: "URL scraping started", documentId };
  } catch (error) {
    console.error("Scraping error:", error);
    const msg = error instanceof Error ? error.message : "Failed to scrape URL";
    return { success: false, error: msg };
  }
};
