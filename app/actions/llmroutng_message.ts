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
    const kbDescription =
      chatbot.DocwithDescriptions?.map((doc) => doc.documentDescription || "")
        .filter(Boolean)
        .join(". ") || "No specific knowledge base configured";

    // Get cached model
    const chatModel = getCachedModel(
      modelName || "llama-3.1-8b-instant",
      temperature ?? 0.5,
      maxTokens || 1000,
    );

    // STEP 1: Quick classification with the same model
    console.log("🔀 Routing query...");
    const routingPrompt = buildRoutingPrompt(prompt, kbDescription);

    const routingResponse = await chatModel.invoke([
      new SystemMessage(routingPrompt),
    ]);

    const needsTool = String(routingResponse.content)
      .trim()
      .toLowerCase()
      .includes("true");
    console.log(needsTool ? "🔍 KB retrieval enabled" : "💬 Generic mode");

    // STEP 2: Retrieval (if needed)
    let context = "";
    let retrievedDocs: any[] = [];

    if (needsTool) {
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
      needsTool,
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

const buildRoutingPrompt = (userQuery: string, kbDescription: string) => {
  return `You are a routing classifier. Your task is to determine if a user query needs information from the knowledge base or can be answered without it.

KNOWLEDGE BASE DESCRIPTION:
${kbDescription}

YOUR DECISION LOGIC:

RETURN "true" (TOOL NEEDED) when:
- The query asks for SPECIFIC INFORMATION about products, services, or data that would be stored in documents
- The query contains FACTUAL QUESTIONS that require retrieving stored knowledge (names, dates, policies, procedures, technical details)
- The query refers to DOCUMENTS, FAQs, guides, manuals, or any content that users have uploaded
- You need to VERIFY or LOOKUP information rather than making general conversation
- When in doubt about accuracy, it's safer to check the knowledge base than to guess

Examples of queries needing the tool:
- "What information do you have about X?"
- "Tell me about the details in the document"
- "Can you find information on this topic?"
- "What does it say about...?"
- "Give me a summary of the content"
- "What are the key points?"

RETURN "false" (TOOL NOT NEEDED) when:
- The query is a GREETING or SMALL TALK that doesn't require any specific information
- The query is a simple ACKNOWLEDGMENT or CLOSING statement
- The query asks about HOW YOU WORK as an AI (meta questions about your capabilities)
- The query is CONVERSATIONAL FOLLOW-UP that doesn't need document retrieval (like "can you explain that differently?")
- The query can be answered through GENERAL KNOWLEDGE or COMMON SENSE without accessing stored documents

Examples of queries NOT needing the tool:
- "Hi, how are you?"
- "Thanks for your help"
- "Goodbye"
- "Can you repeat that?"
- "How do you work?"

IMPORTANT: The knowledge base contains information about: ${kbDescription}
If the user query is asking about topics covered in this description, return "true". If the query is unrelated to this content and is just casual conversation, return "false".

USER QUERY: "${userQuery}"

Analyze the query above and respond with ONLY "true" or "false" - no explanation, no other text.`;
};
