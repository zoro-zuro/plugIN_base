// lib/tools.ts
import { StructuredTool } from "@langchain/core/tools";
import { getPineconeVectorStore } from "./vectorStore";
import { z } from "zod";

const MAX_CONTEXT_CHARS = 2500;
const MIN_RELEVANCE_SCORE = 0.4; // ✅ Filter low-quality results

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

      // ✅ Use similarity search (faster than MMR, good enough for most cases)
      const scoredResults = await vectorStore.similaritySearchWithScore(
        searchQuery,
        3, // Get 3 results with scores
      );

      // ✅ Early exit on no results
      if (!scoredResults.length) {
        console.log(`🔧 No results found`);
        this.lastDocs = [];
        const result = "No relevant information found in the knowledge base.";
        searchCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // ✅ Filter by relevance score
      const relevantResults = scoredResults.filter(
        ([_, score]) => score >= MIN_RELEVANCE_SCORE,
      );

      if (!relevantResults.length) {
        console.log(
          `🔧 Top score ${scoredResults[0][1].toFixed(3)} below threshold ${MIN_RELEVANCE_SCORE}`,
        );
        this.lastDocs = [];
        const result =
          "No sufficiently relevant information found in the knowledge base for this query.";
        searchCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      const docs = relevantResults.map(([doc, score]) => {
        console.log(
          `   📄 Score: ${score.toFixed(3)} - ${doc.metadata?.fileName || "Unknown"}`,
        );
        return doc;
      });

      this.lastDocs = docs;

      console.log(`🔧 Retrieved ${docs.length} documents`);

      // ✅ Build context efficiently (pre-allocate array size)
      const contextParts: string[] = [];
      let totalLength = 0;

      for (let idx = 0; idx < docs.length; idx++) {
        const doc = docs[idx];
        const source = doc.metadata?.fileName || `Source ${idx + 1}`;
        const part = `[${source}]\n${doc.pageContent}`;

        // ✅ Stop early if we hit max length
        if (totalLength + part.length > MAX_CONTEXT_CHARS) {
          contextParts.push(part.slice(0, MAX_CONTEXT_CHARS - totalLength));
          contextParts.push("\n\n[...truncated]");
          break;
        }

        contextParts.push(part);
        totalLength += part.length;

        if (idx < docs.length - 1) {
          contextParts.push("\n\n---\n\n");
          totalLength += 9;
        }
      }

      const context = contextParts.join("");

      console.log(`🔧 Returning ${context.length} chars`);

      // ✅ Cache the result
      searchCache.set(cacheKey, { result: context, timestamp: Date.now() });

      return context;
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
