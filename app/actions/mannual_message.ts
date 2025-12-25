"use server";

import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Doc } from "@/convex/_generated/dataModel";
import { needTool } from "@/lib/intent";
import { buildSystemPrompt } from "@/lib/customPrompt";
import { getCachedModel } from "@/lib/getChacedModel";
import { KnowledgeBaseTool } from "@/lib/tools";

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

export const generateResponse = async (
  prompt: string,
  options: GenerateOptions,
) => {
  console.log("=== AGENT FLOW START ===");
  console.log("Query:", prompt);
  const startTime = Date.now();

  const {
    chatHistory = [],
    chatbot,
    sessionId = "default",
    evalMode = false,
  } = options;

  // --- Validation ---
  if (!prompt?.trim()) {
    return { success: false, error: "Prompt cannot be empty" };
  }

  try {
    // --- Extract chatbot config ---
    const {
      namespace,
      modelName,
      temperature,
      maxTokens,
      welcomeMessage,
      errorMessage,
      systemPrompt,
      DocwithDescriptions,
    } = chatbot;

    // --- Validate required fields ---
    if (!namespace) {
      return {
        success: false,
        error: "Chatbot configuration incomplete: missing namespace",
      };
    }

    // --- Extract and dedupe KB keywords ---
    const keywords: string[] =
      DocwithDescriptions?.flatMap((doc) => doc.documentKeywords || []) || [];
    const uniqueKeywords = Array.from(
      new Set(keywords.map((k) => k.toLowerCase())),
    );

    console.log(
      `📌 KB Keywords (${uniqueKeywords.length}):`,
      uniqueKeywords.slice(0, 10),
    );

    // --- Get cached model ---
    const chatModel = getCachedModel(
      modelName || "llama-3.1-8b-instant",
      temperature ?? 0.5,
      maxTokens || 1000,
    );

    // --- Route: Does this need KB? ---
    const isToolNeeded = needTool({ tKeywords: uniqueKeywords, query: prompt });
    console.log(isToolNeeded ? "🔍 KB retrieval enabled" : "💬 Generic mode");

    // --- Retrieval (if needed) ---
    let context = "";
    let retrievedDocs: any[] = [];

    if (isToolNeeded && !evalMode) {
      const kbTool = new KnowledgeBaseTool(namespace);
      try {
        context = await kbTool._call({ query: prompt }); // ✅ Correct param name
        retrievedDocs = kbTool.lastDocs || [];
        console.log(
          `📄 Retrieved ${retrievedDocs.length} docs, ${context.length} chars`,
        );
      } catch (err) {
        console.error("⚠️ KB retrieval error:", err);
        // Soft fail: continue without context
      }
    }

    // --- Build system prompt ---
    const systemMessage = buildSystemPrompt(
      isToolNeeded,
      context,
      welcomeMessage || "Hello! How can I assist you?",
      errorMessage || "I'm sorry, something went wrong.",
      systemPrompt || "",
    );

    console.log("System prompt preview:", systemMessage.slice(0, 300));

    // --- Prepare messages ---
    // Last 6 messages for input (efficient context window usage)
    const recentHistory = chatHistory.slice(-6);
    let messages;

    if (evalMode) {
      // Eval: no history
      messages = [new SystemMessage(systemMessage), new HumanMessage(prompt)];
    } else {
      // Normal: include recent history
      const historyMessages = recentHistory.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      );

      messages = [
        new SystemMessage(systemMessage),
        ...historyMessages,
        new HumanMessage(prompt),
      ];
    }

    // --- Invoke model (direct, no agent/tools) ---
    console.log(`⚡ Invoking model... (${Date.now() - startTime}ms elapsed)`);
    const response = await chatModel.invoke(messages);

    const responseText =
      typeof response.content === "string"
        ? response.content
        : String(response.content || "");

    console.log(`✅ Response generated: ${responseText.length} chars`);

    // --- Update memory ---
    // Keep last 10 messages in storage for caller to persist
    let updatedHistory: Message[] | undefined;

    if (!evalMode) {
      const newHistory: Message[] = [
        ...chatHistory,
        { role: "user", content: prompt },
        { role: "assistant", content: responseText },
      ];
      updatedHistory = newHistory.slice(-10);
      console.log(`💾 Memory updated: ${updatedHistory.length} messages`);
    }

    console.log(`=== AGENT FLOW END (Total: ${Date.now() - startTime}ms) ===`);

    return {
      success: true,
      answer: responseText || "No response generated",
      memory: updatedHistory,
      contexts: retrievedDocs.map((d: any) => ({
        pageContent: d.pageContent || "",
        metadata: d.metadata || {},
      })),
    };
  } catch (error) {
    console.error("❌ Error:", error);

    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Soft-fail for retrieval errors (don't show scary message to user)
    if (
      errMsg.toLowerCase().includes("tool") ||
      errMsg.toLowerCase().includes("retrieval")
    ) {
      return {
        success: true,
        answer:
          "I couldn't retrieve specific details right now, but I'm here to help with general questions based on our conversation.",
        memory: evalMode
          ? undefined
          : [
              ...chatHistory,
              { role: "user", content: prompt },
              {
                role: "assistant",
                content:
                  "I couldn't retrieve specific details right now, but I'm here to help with general questions based on our conversation.",
              },
            ].slice(-10),
        contexts: [],
      };
    }

    return {
      success: false,
      error: `Error: ${errMsg}`,
    };
  }
};
