// app/actions/delFile.ts
"use server";

import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME!;

export async function deletePineconeVectors(
  documentId: string,
  namespace: string,
) {
  console.log("🧹 deletePineconeVectors called (query + delete by ids)");
  console.log("  INDEX_NAME:", INDEX_NAME);
  console.log("  namespace (arg):", namespace);
  console.log("  documentId (arg):", documentId);

  if (!INDEX_NAME) {
    console.error("❌ PINECONE_INDEX_NAME env var is missing");
    return { success: false, error: "PINECONE_INDEX_NAME env var is missing" };
  }
  if (!namespace) {
    console.error("❌ No namespace provided to deletePineconeVectors");
    return { success: false, error: "Namespace is required for deletion" };
  }

  try {
    const index = pinecone.index(INDEX_NAME).namespace(namespace);
    console.log("✅ Got Pinecone index instance");

    // 1) query to find vector ids for this documentId
    const queryRes = await index.query({
      vector: new Array(768).fill(0),
      topK: 500,
      includeMetadata: true,
      filter: {
        documentId: { $eq: documentId },
      },
    });

    console.log("✅ Pinecone query call completed");

    const ids = (queryRes.matches || []).map((m) => m.id);
    console.log("🔍 Query matches for documentId:", documentId, "ids:", ids);

    if (ids.length === 0) {
      console.log("ℹ️ No vectors found for this documentId");
      return {
        success: true,
        message: `No vectors found for documentId ${documentId} in namespace ${namespace}`,
      };
    }

    // 2) delete those ids - CORRECTED: pass array directly
    console.log("➡️ Sending deleteMany request to Pinecone with ids:", ids);

    await index.deleteMany(ids);

    console.log("✅ Pinecone deleteMany call completed");

    return {
      success: true,
      message: `Deleted ${ids.length} vectors for documentId ${documentId} in namespace ${namespace}`,
    };
  } catch (error) {
    console.error("❌ Pinecone deletion error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function resetVectors(namespace: string) {
  console.log("🧹 resetVectors called");
  console.log("  INDEX_NAME:", INDEX_NAME);
  console.log("  namespace (arg):", namespace);

  if (!INDEX_NAME) {
    console.error("❌ PINECONE_INDEX_NAME env var is missing");
    return { success: false, error: "PINECONE_INDEX_NAME env var is missing" };
  }
  if (!namespace) {
    console.error("❌ No namespace provided");
    return { success: false, error: "Namespace is required for deletion" };
  }

  try {
    const index = pinecone.index(INDEX_NAME).namespace(namespace);
    console.log("✅ Got Pinecone index instance");

    // Delete all vectors in the namespace
    await index.deleteAll();

    console.log("✅ Pinecone delete All call completed");

    return {
      success: true,
      message: `Deleted all vectors for namespace ${namespace}`,
    };
  } catch (error) {
    console.error("❌ Pinecone deletion error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
