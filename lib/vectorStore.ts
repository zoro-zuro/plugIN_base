import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "./embeddings";

// ✅ Cache Pinecone client
let pineconeClient: Pinecone | null = null;

// ✅ Cache vector stores by namespace
const vectorStoreCache = new Map<string, PineconeStore>();

function getPineconeClient() {
  if (!pineconeClient) {
    console.log("🆕 Creating Pinecone client");
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export async function getPineconeVectorStore(namespace: string = "default") {
  // ✅ Return cached vector store if exists
  if (vectorStoreCache.has(namespace)) {
    console.log(`♻️ Reusing cached vector store: ${namespace}`);
    return vectorStoreCache.get(namespace)!;
  }

  console.log(`🆕 Creating vector store: ${namespace}`);

  // 1. Get Cached Client
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || "plugin-rag-index";
  const index = pinecone.Index(indexName);

  // 2. Get Embeddings
  const embeddings = getEmbeddings();

  // 3. Create Store (only once per namespace)
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index as any,
    namespace: namespace,
    maxConcurrency: 5,
  });

  // ✅ Cache it
  vectorStoreCache.set(namespace, vectorStore);

  return vectorStore;
}

// ✅ Optional: Clear cache if needed (e.g., after uploading new docs)
export function clearVectorStoreCache(namespace?: string) {
  if (namespace) {
    console.log(`🗑️ Clearing cache for: ${namespace}`);
    vectorStoreCache.delete(namespace);
  } else {
    console.log("🗑️ Clearing all vector store cache");
    vectorStoreCache.clear();
  }
}
