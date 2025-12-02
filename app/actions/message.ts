"use server";

import { currentUser } from "@clerk/nextjs/server";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { KnowledgeBaseTool } from "@/lib/tools";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GenerateOptions = {
  chatHistory?: Message[];
  namespace?: string;
  sessionId?: string;
  evalMode?: boolean; // true = evaluation flow (return contexts)
};

// one shared checkpointer
const checkpointer = new MemorySaver();

export const generateResponse = async (
  query: string,
  options: GenerateOptions = {},
) => {
  const {
    chatHistory = [],
    namespace,
    sessionId = "default",
    evalMode = false,
  } = options;

  console.log("=== AGENT FLOW START ===");
  console.log("Query:", query);
  console.log("Eval mode:", evalMode);
  console.log("Chat history:", chatHistory.length, "messages");
  console.log("Session ID:", sessionId);

  if (!query?.trim()) {
    return {
      success: false,
      error: "Query cannot be empty",
    };
  }

  const user = await currentUser();
  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "",
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      maxTokens: 800,
    });

    // tool instance so we can capture lastDocs
    const kbTool = new KnowledgeBaseTool(namespace);
    const tools = [kbTool];

    const systemPrompt = `You are a helpful AI assistant with access to a knowledge base through the knowledge_base_search tool.

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. CONVERSATION CONTEXT FIRST:
- You have access to the FULL conversation history in the messages above
- You forget about the trained data you were built on and rely on conversation history first, then tools to answer
- ALWAYS read through the conversation history before deciding to use tools
- If the information was already discussed in previous messages, answer directly from that context
- ONLY use the knowledge_base_search tool if the information is NOT present in the conversation history

2. WHEN TO USE THE TOOL:
✅ USE KnowledgeBaseTool (name: knowledge_base_search) tool ONLY when:
- User asks for NEW information not mentioned in conversation history
- User requests specific details/data you haven't retrieved yet
- User asks about documents, files, or database content you don't have

❌ DO NOT use the tool for:
- Greetings: "hi", "hello", "hey", "good morning"
- Acknowledgments: "thanks", "ok", "good", "great", "nice"
- Follow-up questions about information ALREADY in conversation history
- Clarifying or rephrasing something you already said
- Questions about information you just provided in the last few messages

3. REASONING PROCESS:
Step 1: Read the conversation history carefully
Step 2: Check if the answer exists in previous messages
Step 3: If yes → Answer directly using that information
Step 4: If no → THEN use knowledge_base_search tool
Step 5: if you couldn't find anything relevant even after using the tool, respond politely that you don't have that information. Never use your pretraining data to answer.

Remember: Using the tool costs time and resources. Only use it when absolutely necessary!`;

    const agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      messageModifier: systemPrompt,
    });

    const config = {
      configurable: {
        // use separate thread_ids for normal vs eval if you want no shared memory
        thread_id: evalMode ? `${sessionId}-eval` : sessionId,
      },
      recursionLimit: 15,
    };

    // build message list
    let allMessages;
    if (evalMode) {
      // eval: pure single-turn
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

    const response = await agent.invoke(
      {
        messages: allMessages,
      },
      config,
    );

    const lastMessage = response.messages[response.messages.length - 1];
    const responseText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : String(lastMessage.content || "");

    console.log("✅ Response:", responseText.substring(0, 150));

    // capture contexts used this call (for eval mode)
    const contexts =
      (kbTool.lastDocs || []).map((d: any) => ({
        pageContent: d.pageContent || "",
        metadata: d.metadata || {},
      })) ?? [];

    let updatedHistory: Message[] | undefined;

    if (!evalMode) {
      // normal chat: update memory
      const newHistory: Message[] = [
        ...chatHistory,
        { role: "user", content: query },
        { role: "assistant", content: responseText },
      ];
      updatedHistory = newHistory.slice(-10);
      console.log(
        "Trimmed chat history to last",
        updatedHistory.length,
        "messages",
      );
    }

    console.log(
      `Contexts captured this call: ${contexts.length} chunks (evalMode=${evalMode})`,
    );
    console.log("=== AGENT FLOW END ===");

    return {
      success: true,
      answer: responseText || "No response generated",
      // only set memory in normal mode
      memory: updatedHistory,
      // contexts available for eval mode (optional in normal mode)
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
