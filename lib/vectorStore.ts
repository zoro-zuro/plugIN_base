import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "./embeddings";

// Global cache for the Pinecone client to prevent reconnection overhead
let pineconeClient: Pinecone | null = null;

function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export async function getPineconeVectorStore(namespace: string = "default") {
  // 1. Get Cached Client
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || "plugin-rag-index";
  const index = pinecone.Index(indexName);

  // 2. Get Embeddings (Ensure getEmbeddings is also optimized/cached if possible)
  const embeddings = getEmbeddings();

  // 3. Create Store
  // Note: We await here because 'fromExistingIndex' validates the connection
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index as any,
    namespace: namespace,
    maxConcurrency: 5, // Keep this for fast uploads
  });

  return vectorStore;
}
