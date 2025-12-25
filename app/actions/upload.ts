"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getPineconeVectorStore } from "@/lib/vectorStore";
import { preprocessDocument } from "@/lib/preprocessing";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { generateKeywords } from "@/app/actions/generateKeywords";
import { getCachedModel } from "@/lib/getChacedModel";

// Helper function to process Pinecone in background
async function processVectorsInBackground(
  fileBuffer: Buffer,
  fileName: string,
  namespace: string,
  documentId: Id<"documents">,
  userId: string,
  description: string,
) {
  try {
    console.time("Background Vector Processing");

    // 1. Chunking (Fast with Node.js)
    const documents = await preprocessDocument(
      fileBuffer,
      fileName,
      namespace,
      undefined as any,
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
      },
    }));

    // 3. Upsert to Pinecone (Fast with Cloudflare Embeddings)
    // Note: getPineconeVectorStore uses your new 'lib/embeddings.ts' which uses Cloudflare
    const vectorStore = await getPineconeVectorStore(namespace);
    await vectorStore.addDocuments(documentsWithId);

    // 4. ✅ Update the Chunk Count in Convex (so UI shows correct count later)
    await fetchMutation(api.documents.updateChunkCount, {
      // Make sure you created this mutation!
      documentId,
      chunksCount: documents.length,
    });

    console.timeEnd("Background Vector Processing");
    console.log(`✅ [Background] Vectors upserted for ${fileName}`);
  } catch (error) {
    console.error("❌ [Background] Vector processing failed:", error);
    // Optional: Mark document as "failed" in Convex
  }
}

export const uploadDocumentWithDescription = async (
  file: File,
  description: string,
  namespace: string,
) => {
  const user = await currentUser();
  if (!user) return { success: false, error: "User not authenticated" };
  if (!namespace) return { success: false, error: "Namespace required" };

  try {
    const fileName = file.name;
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // --- STEP 1: FAST UPLOAD TO CONVEX (Critical Path - ~1-2s) ---
    // console.time("Convex Upload");

    // const uploadUrl = await fetchMutation(api.documents.generateUploadUrl);

    // const uploadResponse = await fetch(uploadUrl, {
    //   method: "POST",
    //   headers: { "Content-Type": file.type || "application/octet-stream" },
    //   body: fileBuffer,
    // });

    // if (!uploadResponse.ok) throw new Error("Convex upload failed");
    // const { storageId } = await uploadResponse.json();

    // Step 1b: Generate keywords from description

    const model = getCachedModel(
      "llama-3.3-70b-versatile",
      0.5,
      300,
      process.env.GROQ_API_KEY,
    );
    const keywords = await generateKeywords(description, model);

    const documentId = await fetchMutation(api.documents.saveDocument, {
      userId: user.id,
      fileName,
      fileSize,
      fileType: fileName.split(".").pop() || "unknown",
      fileKeywords: keywords,
      // storageId: storageId as Id<"_storage">,
      chunksCount: 0, // Placeholder
      namespace,
      fileDescription: description,
    });
    console.timeEnd("Convex Upload");

    // --- STEP 2: TRIGGER BACKGROUND PROCESSING (Fire & Forget) ---
    // Do NOT await this. This makes the UI return instantly.
    processVectorsInBackground(
      fileBuffer,
      fileName,
      namespace,
      documentId,
      user.id,
      description,
    ).catch((err) => console.error("Background process error:", err));

    return {
      success: true,
      message: "File uploaded. AI processing started in background.",
      documentId,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Upload failed" };
  }
};
