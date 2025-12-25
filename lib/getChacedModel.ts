import { ChatGroq } from "@langchain/groq";

const modelCache = new Map<string, ChatGroq>();

export const getCachedModel = (
  modelName: string,
  temperature: number,
  maxTokens: number,
  apiKey?: string,
): ChatGroq => {
  // ✅ Cache key based on model config only (namespace doesn't matter)
  const key = `${modelName}-${temperature}-${maxTokens}`;
  console.log(process.env.GROQ_API_KEY ? "******" : apiKey);
  if (!modelCache.has(key)) {
    // ✅ Fixed
    console.log(`🆕 Creating new model instance: ${key}`);
    modelCache.set(
      key,
      new ChatGroq({
        apiKey: process.env.GROQ_API_KEY! || apiKey,
        model: modelName,
        temperature,
        maxTokens,
      }),
    );
  } else {
    console.log(`♻️ Reusing cached model: ${key}`);
  }

  return modelCache.get(key)!;
};
