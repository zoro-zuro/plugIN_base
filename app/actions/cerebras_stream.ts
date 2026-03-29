"use server";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { KnowledgeBaseTool } from "@/lib/tools";
import { Doc } from "@/convex/_generated/dataModel";
import { getCachedModel } from "@/lib/test_cache_model";
import {
  isAmbiguousFollowUp,
  isTrivialInput,
  TRIVIAL_SYSTEM_PROMPT,
  getStaticSystemPrompt, // ✅ Imported new function
} from "@/lib/chat_utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type StreamOptions = {
  chatHistory?: Message[];
  chatbot: Doc<"chatbots">;
  sessionId?: string;
  evalMode?: boolean;
};

export async function generateResponseStream(
  query: string,
  options: StreamOptions,
) {
  const { chatHistory = [], chatbot } = options;
  const startTime = Date.now();

  console.log("=== STREAM START ===");

  if (!query?.trim()) throw new Error("Query cannot be empty");
  if (!chatbot.namespace) throw new Error("Namespace not found");

  const temperature = chatbot?.temperature ?? 0.5;
  const maxTokens = chatbot?.maxTokens || 1000;

  // Normalize model name (remove extra dashes from 'llama-3' vs 'llama3')
  const rawModel = (chatbot?.modelName || "llama3.1-8b").toLowerCase();
  const normalizedModel = rawModel.replace("llama-", "llama");

  const model = getCachedModel(normalizedModel, temperature, maxTokens);
  const kbTool = new KnowledgeBaseTool(chatbot.namespace);

  // Validation helpers
  const trivial = isTrivialInput(query);
  const isFollowUp = isAmbiguousFollowUp(query) && chatHistory.length > 0;

  // Prepare history
  const recentHistory = chatHistory
    .slice(-6)
    .map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

  const encoder = new TextEncoder();
  const sendProgress = (step: string, status: string) => {
    // console.log(`📤 ${step} = ${status}`);
    return encoder.encode(
      `__PROGRESS__${JSON.stringify({ step, status })}__END__\n`,
    );
  };

  // ✅ TRIVIAL MODE (Optimized)
  if (trivial || isFollowUp) {
    console.log("⚡ Trivial - Direct streaming");

    const systemPrompt = `${TRIVIAL_SYSTEM_PROMPT}\n\nUSER PERSONA:\n${chatbot.systemPrompt || "None"}`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...recentHistory,
      new HumanMessage(query),
    ];

    return new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(sendProgress("processing", "active"));
          const stream = await model.stream(messages);
          controller.enqueue(sendProgress("processing", "complete"));

          // Gap filler for UI smoothness
          controller.enqueue(sendProgress("generating", "active"));
          let firstTokenSent = false;

          for await (const chunk of stream) {
            const content = chunk.content;
            if (content && typeof content === "string" && content.length > 0) {
              if (!firstTokenSent) {
                controller.enqueue(sendProgress("generating", "complete"));
                firstTokenSent = true;
              }
              controller.enqueue(encoder.encode(content));
            }
          }
          console.log(`⚡ Stream done (${Date.now() - startTime}ms)`);
          controller.close();
        } catch (error) {
          console.error("❌ Error:", error);
          controller.enqueue(sendProgress("error", "error"));
          controller.error(error);
        }
      },
    });
  }

  // ✅ COMPLEX MODE (Agent)
  console.log("🔍 Complex - Agent streaming");

  // 1. Get Cached System Prompt (Includes Welcome/Error msgs now!)
  const staticSystemPrompt = getStaticSystemPrompt(chatbot);

  // 2. Wrap in SystemMessage to preserve cache object identity
  const systemMessage = new SystemMessage(staticSystemPrompt);

  const agent = createReactAgent({
    llm: model,
    tools: [kbTool],
    messageModifier: systemMessage, // ✅ Pass object, not string
  });

  const allMessages = [...recentHistory, new HumanMessage(query)];

  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(sendProgress("processing", "active"));

        const eventStream = agent.streamEvents(
          { messages: allMessages },
          {
            recursionLimit: 15,
            version: "v2",
          },
        );

        let toolPhase = false;
        let processingDone = false;
        let searchingDone = false;
        let generatingStarted = false;

        for await (const event of eventStream) {
          // Tool Start
          if (event.event === "on_tool_start") {
            toolPhase = true;
            if (!processingDone) {
              controller.enqueue(sendProgress("processing", "complete"));
              processingDone = true;
            }
            controller.enqueue(sendProgress("searching", "active"));
            console.log(`🔧 Tool: ${event.name}`);
          }

          // Tool End
          if (event.event === "on_tool_end") {
            toolPhase = false;
            if (!searchingDone) {
              controller.enqueue(sendProgress("searching", "complete"));
              searchingDone = true;

              // ✅ Start generating step immediately to kill dead air
              controller.enqueue(sendProgress("generating", "active"));
              generatingStarted = true;
            }
          }

          // Chat Stream
          if (event.event === "on_chat_model_stream") {
            if (toolPhase) continue;

            const chunk = event.data?.chunk;
            const content = chunk?.content || chunk?.kwargs?.content;

            if (content && typeof content === "string" && content.length > 0) {
              if (!processingDone) {
                controller.enqueue(sendProgress("processing", "complete"));
                processingDone = true;
              }
              // Mark generation active if we skipped tool phase (direct answer)
              if (!generatingStarted && !searchingDone) {
                // Should have been generating
              }

              if (generatingStarted) {
                controller.enqueue(sendProgress("generating", "complete"));
                generatingStarted = false;
              }
              controller.enqueue(encoder.encode(content));
            }
          }
        }

        console.log(`⚡ Stream done (${Date.now() - startTime}ms)`);
        controller.close();
      } catch (error) {
        console.error("❌ Error:", error);
        controller.enqueue(sendProgress("error", "error"));
        controller.error(error);
      }
    },
  });
}
