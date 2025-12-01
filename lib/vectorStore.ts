import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "./embeddings";

export async function getPineconeVectorStore(namespace?: string) {
  console.log("--- Initializing Pinecone Vector Store ---");
  console.log("Namespace:", namespace || "default");

  // Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  console.log("✅ Pinecone client created");

  const indexName = process.env.PINECONE_INDEX_NAME || "plugin-rag-index";
  console.log("Index name:", indexName);

  const index = pinecone.Index(indexName);
  console.log("✅ Pinecone index accessed");

  // Get embeddings
  console.log("Getting embeddings...");
  const embeddings = getEmbeddings();
  console.log("✅ Embeddings model initialized");

  // Create vector store
  console.log("Creating PineconeStore from existing index...");
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index as any,
    namespace: namespace,
  });
  console.log("✅ Vector store created successfully");
  console.log("--- Vector Store Initialization Complete ---");

  return vectorStore;
}
