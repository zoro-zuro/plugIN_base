import { Tool } from "@langchain/core/tools";
import { getPineconeVectorStore } from "./vectorStore";

const MAX_CONTEXT_CHARS = 4000; // prevent over-long prompts

export class KnowledgeBaseTool extends Tool {
  name = "knowledge_base_search";
  description = `Search through the user's knowledge base and uploaded documents.
Use this tool when:
- The user asks about specific data, files, policies, or information stored in documents.
- You need factual information to answer the question.

Do NOT use this for:
- "Hi", "Hello", "Bye", "Thanks" (Standard greetings/closings).
- General chitchat or questions clearly not about the company data.

Input should be a clear search query describing what information is needed.`;

  private namespace?: string;

  // stores docs from the most recent call; useful for eval
  public lastDocs: any[] = [];

  constructor(namespace?: string) {
    super();
    this.namespace = namespace;
  }

  async _call(query: string): Promise<string> {
    console.log(`🔧 TOOL: Searching knowledge base for: "${query}"`);

    try {
      const vectorStore = await getPineconeVectorStore(this.namespace);

      const retriever = vectorStore.asRetriever({
        k: 3, // slightly higher k for better coverage
        searchType: "mmr", // more diverse but still relevant results
        searchKwargs: {
          lambda: 0.7, // 0.7 relevance / 0.3 diversity
        },
      });

      const docs = await retriever.invoke(query);
      this.lastDocs = docs;

      console.log(`🔧 TOOL: Found ${docs.length} relevant documents`);

      if (!docs.length) {
        return "No relevant information found in the knowledge base. The user may need to upload relevant documents first.";
      }

      const rawContext = docs
        .map((doc, idx) => {
          const source = doc.metadata?.fileName || `Source ${idx + 1}`;
          return `[${source}]\n${doc.pageContent}`;
        })
        .join("\n\n---\n\n");

      // Hard cap on context length to keep prompts fast and cheap
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
