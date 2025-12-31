"use server";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
// import { MemorySaver } from "@langchain/langgraph";
import { KnowledgeBaseTool } from "@/lib/tools";
import { Doc } from "@/convex/_generated/dataModel";
import { getCachedModel } from "@/lib/test_cache_model";
import {
  BASE_SYSTEM_PROMPT,
  isAmbiguousFollowUp,
  isTrivialInput,
  TRIVIAL_SYSTEM_PROMPT,
} from "@/lib/chat_utils";

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

// --- MAIN ACTION ---

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
  const startTime = Date.now();

  if (!query?.trim()) {
    return { success: false, error: "Query cannot be empty" };
  }

  const finalNamespace = chatbot.namespace;
  if (!finalNamespace) {
    return { success: false, error: "Namespace not found or undefined" };
  }

  try {
    const modelName = "llama-3.3-70b";
    const temperature = chatbot?.temperature ?? 0.5;
    const maxTokens = chatbot?.maxTokens || 500;
    const greeting =
      chatbot?.welcomeMessage || "Hello! How can I assist you today?";
    const errorMsg =
      chatbot?.errorMessage || "I'm sorry, something went wrong.";

    // ✅ Extract User Custom Instructions
    const userCustomPrompt = chatbot?.systemPrompt || "";

    console.log("Using Model:", modelName);
    console.log("User Preference:", userCustomPrompt ? "Present" : "None");

    // ✅ USE CACHED MODEL
    const model = getCachedModel(modelName, temperature, maxTokens);

    const kbTool = new KnowledgeBaseTool(finalNamespace);
    const tools = [kbTool];

    // --- DYNAMIC CONFIGURATION ---
    const trivial = isTrivialInput(query);
    const isFollowUp = isAmbiguousFollowUp(query) && chatHistory.length > 0;

    let modelWithTools;
    let systemPromptToUse;
    let toolsToUse: any[];
    let BasicPrompt: string;

    if (trivial || isFollowUp) {
      console.log(
        `${trivial ? "⚡ Trivial input detected. Switching to Chit-Chat mode." : "⚡Follow up detected. Switching to follow up mode"}`,
      );
      // Trivial mode logic
      BasicPrompt = `${TRIVIAL_SYSTEM_PROMPT}\non greetings use: ${greeting}\non error message use: ${errorMsg}\n`;
      systemPromptToUse = `${BasicPrompt}\n\nUser Persona Instructions:\n${userCustomPrompt}`;
      modelWithTools = model;
      toolsToUse = [];
    } else {
      console.log("🔍 Complex input detected. Enabling Knowledge Base.");

      // ✅ 1. Start with Immutable Base Prompt
      let finalSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\non greetings use: ${greeting}\non error message use: ${errorMsg}\n`;

      // ✅ 2. Inject Document Context
      if (
        chatbot.DocwithDescriptions &&
        chatbot.DocwithDescriptions.length > 0
      ) {
        const docList = chatbot.DocwithDescriptions.map(
          (d) => `- [${d.documentName}]: ${d.documentDescription}`,
        ).join("\n");

        finalSystemPrompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\nYou have access to the following documents.:\n${docList}\n---------------------------\n`;
        console.log(
          `📄 Injected ${chatbot.DocwithDescriptions.length} docs descriptions.`,
        );
      }

      // ✅ 3. Inject User Custom Instructions (labeled clearly)
      if (userCustomPrompt) {
        finalSystemPrompt += `\n\n--- CUSTOM BEHAVIOR INSTRUCTIONS ---\n${userCustomPrompt}\n------------------------------------\n`;
      }

      // ✅ 4. Final Security Cap (Overrides any malicious user prompt)
      finalSystemPrompt += `\n
TOOL USAGE RULES:
- If the user's question requires NEW information from documents, you MUST call knowledge_base_search.
- If you can answer ENTIRELY from the conversation history above, respond directly WITHOUT calling the tool.
- Vague requests like "try again", "repeat that", or "tell me more" should use conversation context, NOT the tool.
- Never attempt partial tool calls. Either call the tool correctly or don't call it at all.
\n`;

      systemPromptToUse = finalSystemPrompt;
      modelWithTools = model.bindTools(tools, {
        // tool_choice: "auto",
      });
      toolsToUse = tools;
    }

    const agent = createReactAgent({
      llm: trivial || isFollowUp ? model : (modelWithTools as any),
      tools: toolsToUse,
      // checkpointSaver: checkpointer,
      messageModifier: new SystemMessage(systemPromptToUse),
    });

    const config = {
      // configurable: {
      //   thread_id: evalMode
      //     ? `${sessionId}-eval-${Date.now()}-${Math.random().toString(36).slice(2)}`
      //     : sessionId,
      // },
      recursionLimit: 15,
    };

    // --- HISTORY HANDLING ---
    // ✅ Optimized: Only send last 6 messages to keep context window light and fast
    const recentHistory = chatHistory.slice(-6);

    let allMessages;
    if (evalMode) {
      allMessages = [new HumanMessage(query)];
    } else {
      if (recentHistory.length === 0) {
        allMessages = [new HumanMessage(query)];
      } else {
        const historyMessages = recentHistory.map((msg) =>
          msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content),
        );
        allMessages = [...historyMessages, new HumanMessage(query)];
      }
    }
    console.log(`history before invoking ${chatHistory.length}`);
    // --- INVOKE ---
    console.log(
      `⚡ Agent Setup Complete. Invoking... (${Date.now() - startTime}ms elapsed)`,
    );
    const response = await agent.invoke({ messages: allMessages }, config);

    const lastMessage = response.messages[response.messages.length - 1];
    const responseText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : String(lastMessage.content || "");
    console.log(`Generated Response ${responseText}`);
    console.log("✅ Response Generated. Length:", responseText.length);

    // Get contexts ONLY if tool was used
    const contexts =
      (kbTool.lastDocs || []).map((d: any) => ({
        pageContent: d.pageContent || "",
        metadata: d.metadata || {},
      })) ?? [];

    let updatedHistory: Message[] | undefined = [];

    if (!evalMode) {
      const newHistory: Message[] = [
        ...chatHistory,
        { role: "user", content: query },
        { role: "assistant", content: responseText },
      ];
      updatedHistory = newHistory.slice(-10);
    }
    console.log(`chatHistory after invoking : ${updatedHistory.length}`);
    console.log(`=== AGENT FLOW END (Total: ${Date.now() - startTime}ms) ===`);

    return {
      success: true,
      answer: responseText || "No response generated",
      memory: updatedHistory?.slice(-10),
      contexts,
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
