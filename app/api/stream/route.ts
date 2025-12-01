import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { KnowledgeBaseTool } from "@/lib/tools";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const checkpointer = new MemorySaver();
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { query, chatHistory, namespace, sessionId } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response("Query cannot be empty", { status: 400 });
    }

    let streamController: ReadableStreamDefaultController<string> | null = null;

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "",
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      maxTokens: 800,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            if (streamController) {
              streamController.enqueue(token);
            }
          },
        },
      ],
    });

    const tools = [new KnowledgeBaseTool(namespace)];

    const agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      messageModifier: `You are a helpful AI assistant with access to a knowledge base through the knowledge_base_search tool.

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. CONVERSATION CONTEXT FIRST:
- You have access to the FULL conversation history in the messages above
- You forget about the trained data you were built on; you rely on conversation history first then tools to answer
- ALWAYS read through the conversation history before deciding to use tools
- If the information was already discussed in previous messages, answer directly from that context
- ONLY use the knowledge_base_search tool if the information is NOT present in the conversation history

2. WHEN TO USE THE TOOL:
✅ Use knowledge_base_search ONLY when:
- User asks for NEW information not mentioned in conversation history
- User requests specific details/data you haven't retrieved yet
- User asks about documents, files, or database content you don't have

❌ Do NOT use the tool for:
- Greetings or acknowledgments
- Follow-up questions about information ALREADY in conversation history
- Clarifying or repeating something you already said

3. REASONING PROCESS:
Step 1: Read the conversation history carefully
Step 2: Check if the answer exists in previous messages
Step 3: If yes → Answer directly using that information
Step 4: If no → THEN use knowledge_base_search tool
Step 5: If you couldn't find anything relevant even after using the tool, respond politely that you don't have that information. Never use your trained data to answer.

Remember: Using the tool costs time and resources. Only use it when absolutely necessary!`,
    });

    const config = {
      configurable: { thread_id: sessionId ?? "default" },
      recursionLimit: 15,
    };

    const history: HistoryMessage[] = Array.isArray(chatHistory)
      ? chatHistory
      : [];

    const isNewThread = history.length === 0;
    let allMessages;
    if (isNewThread) {
      allMessages = [new HumanMessage(query)];
    } else {
      const historyMessages = history.slice(-10).map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );
      allMessages = [...historyMessages, new HumanMessage(query)];
    }

    const stream = new ReadableStream<string>({
      async start(controller) {
        streamController = controller;
        try {
          await agent.invoke({ messages: allMessages }, config);
          controller.enqueue("\n<<END_OF_MESSAGE>>");
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        } finally {
          streamController = null;
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Streaming route error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
