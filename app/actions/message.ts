"use server";

import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages"; // ✅ Import SystemMessage
import { MemorySaver } from "@langchain/langgraph";
import { KnowledgeBaseTool } from "@/lib/tools";
import { Doc } from "@/convex/_generated/dataModel";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GenerateOptions = {
  chatHistory?: Message[];
  chatbot: Doc<"chatbots">;
  sessionId?: string;
  evalMode?: boolean;
};

const checkpointer = new MemorySaver();

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base through the knowledge_base_search tool.

CRITICAL INSTRUCTIONS:

1. WHEN TO USE THE TOOL:
✅ USE knowledge_base_search ONLY for:
- Specific customer/account questions (e.g., "Who is the account manager?")
- Data retrieval requests (e.g., "What is the revenue?")
- Document-based information

❌ NEVER use the tool for:
- Greetings: "hi", "hello", "hey", "good morning"
- Acknowledgments: "thanks", "ok", "good", "great", "bye"
- Chitchat: "how are you", "nice", "cool"
- Apologies or clarifications

2. FOR NON-SEARCH QUERIES:
- Just respond naturally and politely.

3. CONVERSATION MEMORY:
- Check conversation history first.
- If answer was already given, use it from memory.

4. RESPONSE STYLE:
- Be concise and friendly.
- Don't mention tools or processes.
- Answer directly.

IMPORTANT: Do NOT output XML tags like <function=...>. Use the standard tool calling format provided by the system.`;

export const generateResponse = async (
  query: string,
  options: GenerateOptions,
) => {
  const {
    chatHistory = [],
    chatbot,
    sessionId = "default",
    evalMode = false,
  } = options;

  console.log("=== AGENT FLOW START ===");
  console.log("Query:", query);

  if (!query?.trim()) {
    return { success: false, error: "Query cannot be empty" };
  }

  const finalNamespace = chatbot.namespace;
  if (!finalNamespace) {
    return { success: false, error: "Namespace not found or undefined" };
  }

  try {
    const modelName = chatbot?.modelName || "llama-3.1-8b-instant";
    const temperature = chatbot?.temperature ?? 0.5;
    // ✅ Add the safeguard to WHATEVER system prompt is coming from DB
    const rawSystemPrompt = chatbot?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = `${rawSystemPrompt}\n\nIMPORTANT: Do NOT use XML tags for tool calls. Use standard function calling.`;

    const maxTokens = chatbot?.maxTokens || 500;

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "",
      model: modelName,
      temperature: temperature,
      maxTokens: maxTokens,
    });

    const kbTool = new KnowledgeBaseTool(finalNamespace);
    const tools = [kbTool];

    // ✅ Bind tools explicitly
    const modelWithTools = model.bindTools(tools);

    const agent = createReactAgent({
      llm: modelWithTools,
      tools,
      checkpointSaver: checkpointer,
      // ✅ Pass system prompt as a proper SystemMessage to enforce it
      messageModifier: new SystemMessage(systemPrompt),
    });

    const config = {
      configurable: {
        thread_id: evalMode ? `${sessionId}-eval` : sessionId,
      },
      recursionLimit: 15,
    };

    let allMessages;
    if (evalMode) {
      allMessages = [new HumanMessage(query)];
    } else {
      if (chatHistory.length === 0) {
        allMessages = [new HumanMessage(query)];
      } else {
        const historyMessages = chatHistory
          .slice(-10)
          .map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content),
          );
        allMessages = [...historyMessages, new HumanMessage(query)];
      }
    }

    const response = await agent.invoke({ messages: allMessages }, config);

    const lastMessage = response.messages[response.messages.length - 1];
    const responseText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : String(lastMessage.content || "");

    console.log("✅ Response:", responseText.substring(0, 150));

    const contexts =
      (kbTool.lastDocs || []).map((d: any) => ({
        pageContent: d.pageContent || "",
        metadata: d.metadata || {},
      })) ?? [];

    let updatedHistory: Message[] | undefined;

    if (!evalMode) {
      const newHistory: Message[] = [
        ...chatHistory,
        { role: "user", content: query },
        { role: "assistant", content: responseText },
      ];
      updatedHistory = newHistory.slice(-10);
    }

    console.log("=== AGENT FLOW END ===");

    return {
      success: true,
      answer: responseText || "No response generated",
      memory: updatedHistory,
      contexts,
    };
  } catch (error) {
    console.error("❌ Error:", error);
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
};
