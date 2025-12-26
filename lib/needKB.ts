import { classifyIntent } from "./intentModel";

/**
 * Determine if query needs KB retrieval using TinyBERT
 * NO string matching, NO LLM call, NO delay
 */
export const needTool = async (prompt: string): Promise<boolean> => {
  const startTime = performance.now();

  // ✅ Use TinyBERT classifier (15-30ms)
  const { intent, confidence } = await classifyIntent(prompt);

  const totalTime = performance.now() - startTime;
  console.log(`🔍 Intent detection: ${totalTime.toFixed(0)}ms total`);

  // Route based on intent
  if (intent === "generic") return false;
  if (intent === "follow_up") return false;
  if (intent === "tool_needed") return true;

  // Fallback: if low confidence, default to RAG
  if (confidence < 0.6) {
    console.log(
      `⚠️ Low confidence (${(confidence * 100).toFixed(1)}%), defaulting to RAG`,
    );
    return true;
  }

  return false;
};

// lib/needKB.ts
import { getCachedModel } from "@/lib/getChacedModel";

export const toolNeed = async (
  userQuery: string,
  kbDescription: string,
): Promise<boolean> => {
  const routingModel = getCachedModel("llama-3.1-8b-instant", 0.0, 10);

  const prompt = buildRoutingPrompt(userQuery, kbDescription);

  try {
    const response = await routingModel.invoke(prompt);
    const answer = String(response.content).trim().toLowerCase();

    if (answer.includes("true")) return true;
    if (answer.includes("false")) return false;

    console.warn(
      `⚠️ Unexpected routing response: ${answer}, defaulting to true`,
    );
    return true;
  } catch (error) {
    console.error("❌ Routing error:", error);
    return true;
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
