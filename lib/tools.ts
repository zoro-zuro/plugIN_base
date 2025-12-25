// lib/tools.ts
import { StructuredTool } from "@langchain/core/tools";
import { getPineconeVectorStore } from "./vectorStore";
import { z } from "zod";

const MAX_CONTEXT_CHARS = 2500;

// ✅ Use "query" for consistency
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
    const searchQuery = input.query; // ✅ Fixed

    console.log(`🔧 TOOL: Searching knowledge base for: "${searchQuery}"`);

    try {
      const vectorStore = await getPineconeVectorStore(this.namespace);

      const retriever = vectorStore.asRetriever({
        k: 3,
        searchType: "mmr",
        searchKwargs: {
          lambda: 0.7,
        },
      });

      const docs = await retriever.invoke(searchQuery);
      this.lastDocs = docs;

      console.log(`🔧 TOOL: Found ${docs.length} relevant documents`);

      if (!docs.length) {
        return "No relevant information found in the knowledge base.";
      }

      const rawContext = docs
        .map((doc, idx) => {
          const source = doc.metadata?.fileName || `Source ${idx + 1}`;
          return `[${source}]\n${doc.pageContent}`;
        })
        .join("\n\n---\n\n");

      const context =
        rawContext.length > MAX_CONTEXT_CHARS
          ? rawContext.slice(0, MAX_CONTEXT_CHARS)
          : rawContext;

      console.log(`🔧 TOOL: Returning ${context.length} chars of context`);
      return context;
    } catch (error) {
      console.error("🔧 TOOL ERROR:", error);
      this.lastDocs = [];
      return "Error accessing knowledge base. Please try again.";
    }
  }
}
