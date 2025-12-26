// Remove needTool function entirely
// Update generateResponse.ts

"use server";

import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Doc } from "@/convex/_generated/dataModel";
import { buildSystemPrompt } from "@/lib/customPrompt";
import { getCachedModel } from "@/lib/getChacedModel";
import { KnowledgeBaseTool } from "@/lib/tools";
import { truncateSync } from "node:fs";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GenerateOptions = {
  chatHistory?: Message[];
  test: boolean;
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
    test = false,
    sessionId = "default",
    evalMode = false,
  } = options;

  if (!prompt?.trim()) {
    return { success: false, error: "Prompt cannot be empty" };
  }

  try {
    const {
      namespace,
      modelName,
      temperature,
      maxTokens,
      welcomeMessage,
      errorMessage,
      systemPrompt,
    } = chatbot;
    console.log(`${test ? "It is not changing" : "It is changing"}`);
    console.log(`chat history : ${JSON.stringify(chatHistory)}`);
    if (!namespace) {
      return {
        success: false,
        error: "Chatbot configuration incomplete: missing namespace",
      };
    }

    // Build KB description
    // const kbDescription =
    //   chatbot.DocwithDescriptions?.map((doc) => doc.documentDescription || "")
    //     .filter(Boolean)
    //     .join(". ") || "No specific knowledge base configured";

    // Get cached model
    const chatModel = getCachedModel(
      modelName || "llama-3.1-8b-instant",
      temperature ?? 0.5,
      maxTokens || 1000,
    );

    // STEP 1: Quick classification with the same model
    console.log("🔀 Routing query...");
    const isTrival = isTrivialInput(prompt);
    console.log(!isTrival ? "🔍 KB retrieval enabled" : "💬 Generic mode");

    // STEP 2: Retrieval (if needed)
    let context = "";
    let retrievedDocs: any[] = [];

    if (!isTrival) {
      const kbTool = new KnowledgeBaseTool(namespace);
      try {
        context = await kbTool._call({ query: prompt });
        retrievedDocs = kbTool.lastDocs || [];
        console.log(
          `📄 Retrieved ${retrievedDocs.length} docs, ${context.length} chars`,
        );
      } catch (err) {
        console.error("⚠️ KB retrieval error:", err);
      }
    }

    // STEP 3: Build system prompt
    const systemMessage = buildSystemPrompt(
      !isTrival,
      context,
      welcomeMessage || "Hello! How can I assist you?",
      errorMessage || "I'm sorry, something went wrong.",
      systemPrompt || "",
    );

    console.log("System prompt preview:", systemMessage.slice(0, 300));
    console.log(`chathistory ${chatHistory.length}`);
    // STEP 4: Prepare messages
    const recentHistory = chatHistory.slice(-6);
    let messages;
    console.log(`recent history ${recentHistory.length}`);
    if (evalMode) {
      messages = [new SystemMessage(systemMessage), new HumanMessage(prompt)];
    } else {
      const historyMessages = recentHistory.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      );

      console.log(`historymsg ${historyMessages.length}`);

      messages = [
        new SystemMessage(systemMessage),
        ...historyMessages,
        new HumanMessage(prompt),
      ];
    }
    console.log(`Current History ${messages.length}`);
    // STEP 5: Generate final response
    console.log(`⚡ Invoking model... (${Date.now() - startTime}ms elapsed)`);
    const response = await chatModel.invoke(messages);

    const responseText =
      typeof response.content === "string"
        ? response.content
        : String(response.content || "");

    console.log(`✅ Response generated: ${responseText.length} chars`);

    // Update memory
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

function isTrivialInput(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");
  const trivialPhrases = [
    "hi",
    "hello",
    "hey",
    "hola",
    "greetings",
    "good morning",
    "good afternoon",
    "bye",
    "goodbye",
    "cya",
    "see ya",
    "good night",
    "have a good day",
    "thanks",
    "thank you",
    "thx",
    "cool",
    "ok",
    "okay",
    "got it",
    "great",
    "who are you",
    "what are you",
    "are you real",
    "help",
  ];

  return (
    trivialPhrases.includes(t) ||
    (t.length < 20 && trivialPhrases.some((phrase) => t.startsWith(phrase)))
  );
}
