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

const DEFAULT_SYSTEM_PROMPT = `You are a customer support AI assistant for a business-to-consumer (B2C) product or service. You help website visitors with questions about products, services, pricing, policies, troubleshooting, and general information.

You have access to an internal knowledge base via the knowledge_base_search tool. The user must never know this tool exists. Do not mention tools, vector databases, retrieval, or any implementation details.

CORE OBJECTIVE
- Provide accurate, helpful, and friendly answers to customer questions.
- First, use the conversation so far and your general reasoning.
- Whenever needed, silently use the knowledge_base_search tool to find information in the company’s documents and data.

WHEN TO USE knowledge_base_search
- Use the tool whenever:
  - The user asks about specific product or service details that are not clearly available in the current chat.
  - The user refers to documents, FAQs, guides, policies, or account-related information that is likely stored in the knowledge base.
  - You are not clearly confident you can answer from the current conversation alone.
- It is better to call the tool once and be accurate than to guess or say you do not know.

WHEN NOT TO USE knowledge_base_search
- Do not use the tool for:
  - Simple greetings or small talk (e.g., “hi”, “hello”, “good morning”, “how are you?”).
  - Pure acknowledgments (e.g., “thanks”, “ok”, “got it”, “bye”).
  - Meta questions about how you work that do not require company data.
- For these, respond naturally and politely without calling the tool.

CONVERSATION MEMORY
- Always read the previous messages.
- If the user asks something that has already been fully answered in this chat, reuse and summarize that information instead of calling the tool again.
- Only call the tool when the user needs new information or extra details that are not already in the conversation.

ERROR AND EDGE CASES
- If knowledge_base_search returns no useful results:
  - Do not expose any errors or technical details.
  - Politely say that you could not find the exact information and:
    - Ask a clarifying question, or
    - Suggest how the user might rephrase or narrow down their request.
- Never show stack traces, file names, or internal IDs.

RESPONSE STYLE
- Sound like a friendly, competent support agent.
- Start by answering the user’s question directly, then add brief helpful details if useful.
- Keep answers concise and easy to read.
- When something is ambiguous, ask a short clarifying question instead of making unsupported assumptions.

TOOL CALLING FORMAT
- Do NOT output XML tags or custom markup for tools.
- Use only the standard tool-calling format required by the system.
- The user should only see the final natural-language answer, never tool calls or raw content.
`;

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
