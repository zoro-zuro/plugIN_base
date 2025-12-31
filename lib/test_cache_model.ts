// lib/cerebras_model.ts
import { ChatCerebras } from "@langchain/cerebras";

const modelCache = new Map<string, ChatCerebras>();

export function getCachedModel(
  modelName: string,
  temperature: number,
  maxTokens: number,
) {
  const key = `${modelName}-${temperature}-${maxTokens}`;

  if (!modelCache.has(key)) {
    console.log(`🆕 Creating new Cerebras model: ${key}`);
    modelCache.set(
      key,
      new ChatCerebras({
        model: modelName, // ✅ Correct param name
        temperature: temperature,
        maxTokens: maxTokens,
        apiKey: process.env.CEREBRAS_API_KEY, // ✅ Directly in constructor
        streaming: true, // ✅ Enable streaming
        maxRetries: 2, // ✅ Optional: retry on failures
      }),
    );
  } else {
    console.log(`♻️ Reusing cached Cerebras model: ${key}`);
  }

  return modelCache.get(key)!;
}
