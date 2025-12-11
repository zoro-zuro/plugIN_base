"use server";

// import { currentUser } from "@clerk/nextjs/server";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { KnowledgeBaseTool } from "@/lib/tools";
import { Doc } from "@/convex/_generated/dataModel";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GenerateOptions = {
  chatHistory?: Message[];
  chatbot: Doc<"chatbots">; // ✅ Type-safe chatbot object
  sessionId?: string;
  evalMode?: boolean;
};

const checkpointer = new MemorySaver();

// ✅ Default system prompt if not configured
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
- Just respond naturally and politely
- Examples:
  * User: "hi" → You: "Hello! How can I help you today?"
  * User: "thanks" → You: "You're welcome! Let me know if you need anything else."
  * User: "bye" → You: "Goodbye! Feel free to come back anytime."


3. CONVERSATION MEMORY:
- Check conversation history first
- If answer was already given, use it from memory
- Only call tool for NEW information requests


4. RESPONSE STYLE:
- Be concise and friendly
- Don't mention tools or processes
- Answer directly


Remember: Not every message needs a tool call. Use common sense!`;

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
  console.log("Eval mode:", evalMode);
  console.log("Chat history:", chatHistory.length, "messages");
  console.log("Session ID:", sessionId);
  console.log("chatbot :", chatbot);
  if (!query?.trim()) {
    return {
      success: false,
      error: "Query cannot be empty",
    };
  }

  // ✅ Only check Clerk auth if namespace NOT provided
  const finalNamespace = chatbot.namespace;

  if (!finalNamespace) {
    // const user = await currentUser();
    // if (!user) {
    //   return {
    //     success: false,
    //     error: "User not authenticated",
    //   };
    // }
    // finalNamespace = user.id;
    return {
      success: false,
      error: "Namspace not found or undefined",
    };
  }

  console.log("Using namespace:", finalNamespace);

  try {
    // ✅ Fetch chatbot settings by namespace (fast lookup)
    // const chatbot = await fetchQuery(api.documents.getChatbotByNamespace, {
    //   namespace: finalNamespace,
    // });

    // ✅ Use chatbot settings or fallback to defaults
    const modelName = chatbot?.modelName || "llama-3.1-8b-instant";
    const temperature = chatbot?.temperature ?? 0.5;
    const systemPrompt = chatbot?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const maxTokens = chatbot?.maxTokens || 500;

    console.log("Using model:", modelName, "temp:", temperature);

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "",
      model: modelName, // ✅ From settings
      temperature: temperature, // ✅ From settings
      maxTokens: maxTokens, // ✅ From settings
    });

    // ✅ Use finalNamespace instead of namespace
    const kbTool = new KnowledgeBaseTool(finalNamespace);
    const tools = [kbTool];

    const agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      messageModifier: systemPrompt, // ✅ From settings or default
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
