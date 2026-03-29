// lib/tools.ts
import { StructuredTool } from "@langchain/core/tools";
import { getPineconeVectorStore } from "./vectorStore";
import { z } from "zod";

const MAX_CONTEXT_CHARS = 2500;
const MIN_RELEVANCE_SCORE = 0.2; // ✅ Filter low-quality results

// ✅ Cache search results for identical queries (5 min TTL)
const searchCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const SearchSchema = z.object({
  query: z.string().describe("The search query to find relevant documents"),
});

export class KnowledgeBaseTool extends StructuredTool<typeof SearchSchema> {
  name = "knowledge_base_search";

  description = `Search through the user's knowledge base and uploaded documents.
Use this tool when the user asks about specific data, files, policies, or information stored in documents.`;

  schema = SearchSchema;

  private namespace?: string;
  public lastDocs: any[] = [];

  constructor(namespace?: string) {
    super();
    this.namespace = namespace;
  }

  async _call(input: z.infer<typeof SearchSchema>): Promise<string> {
    const searchQuery = input.query;
    const cacheKey = `${this.namespace}:${searchQuery}`;

    console.log(`🔧 Searching: "${searchQuery}"`);

    // ✅ Check cache first (massive speed boost for repeat queries)
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`⚡ Cache hit (${Date.now() - cached.timestamp}ms old)`);
      return cached.result;
    }

    try {
      const vectorStore = await getPineconeVectorStore(this.namespace);

      const scoredResults = await vectorStore.similaritySearchWithScore(
        searchQuery,
        10, // Retrieve more for potential reranking
      );

      if (scoredResults.length === 0) return "No relevant information found.";

      // 1. Group unique files and collect their context
      const uniqueFiles = new Set<string>();
      scoredResults.forEach(([doc]) => {
        if (doc.metadata?.fileName) uniqueFiles.add(doc.metadata.fileName);
      });

      // 2. Fetch "Headers" (chunk 0) for all unique files
      // This ensures names/titles/metadata at the top are always seen
      const headerDocs = await vectorStore.similaritySearch("", uniqueFiles.size, {
        fileName: { $in: Array.from(uniqueFiles) },
        chunkIndex: 0
      });

      let context = "KNOWLEDGE BASE CONTEXT:\n";
      
      // Inject Headers First (Highest Priority for Identity/Context)
      headerDocs.forEach(h => {
        context += `\n<FILE_HEADER: ${h.metadata.fileName}>\n${h.pageContent}\n</FILE_HEADER>\n`;
      });

      // Inject Scored Chunks
      let totalLength = context.length;
      for (const [doc, score] of scoredResults.slice(0, 5)) {
        const source = doc.metadata?.fileName || "Unknown";
        const part = `\n<DOCUMENT_SNIPPET: ${source} (Relevance: ${Math.round(score * 100)}%)>\n${doc.pageContent}\n</DOCUMENT_SNIPPET>\n`;
        
        if (totalLength + part.length > 8000) break;
        context += part;
        totalLength += part.length;
      }

      const finalContext = `${context}\n\nSearch complete. Use the headers above to identify specific entities if not found in snippets.`;
      
      // ✅ Cache the result
      searchCache.set(cacheKey, { result: finalContext, timestamp: Date.now() });

      return finalContext;
    } catch (error) {
      console.error("🔧 ERROR:", error);
      this.lastDocs = [];
      return "Error accessing knowledge base. Please try again.";
    }
  }
}

// ✅ Clear old cache entries periodically (run every 10 min)
setInterval(
  () => {
    const now = Date.now();
    let cleared = 0;
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        searchCache.delete(key);
        cleared++;
      }
    }
    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired cache entries`);
    }
  },
  10 * 60 * 1000,
);

// ✅ Export cache clearing function
export function clearSearchCache() {
  searchCache.clear();
  console.log("🗑️ Search cache cleared");
}
