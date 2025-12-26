import { pipeline, env } from "@xenova/transformers";

// ✅ Configure like your embeddings
env.allowLocalModels = true;
env.allowRemoteModels = true;

// ✅ Single cached instance (no Map needed)
let intentClassifierInstance: any = null;
let isLoading = false;

/**
 * Get or initialize cached intent classifier
 * Loads once, reuses forever (like your getCachedModel pattern)
 */
export async function getCachedIntentClassifier() {
  // ✅ Prevent race condition on concurrent requests
  if (isLoading) {
    console.log("⏳ Intent classifier loading, waiting...");
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return intentClassifierInstance!;
  }

  if (!intentClassifierInstance) {
    isLoading = true;
    console.log("🆕 Creating intent classifier instance...");
    console.time("Intent Classifier Load");

    try {
      intentClassifierInstance = await pipeline(
        "zero-shot-classification",
        "Xenova/distilbert-base-uncased-mnli",
      );

      console.timeEnd("Intent Classifier Load");
      console.log("✅ Intent classifier cached and ready");
    } catch (error) {
      console.error("❌ Failed to load intent classifier:", error);
      throw error;
    } finally {
      isLoading = false;
    }
  } else {
    console.log("♻️ Reusing cached intent classifier");
  }

  return intentClassifierInstance;
}

/**
 * Classify query intent
 * @returns 'generic' | 'follow_up' | 'tool_needed'
 */
export async function classifyIntent(
  query: string,
): Promise<{intent: "generic" | "follow_up" | "tool_needed"; confidence: number}> {
  const startTime = performance.now();

  const classifier = await getCachedIntentClassifier();

  // ✅ Optimized labels for your use case
  const result = await classifier(
    query,
    [
      "casual greeting acknowledgment thanks farewell",
      "follow-up clarification continuation about previous topic",
      "specific question requiring detailed information or data",
    ],
    {
      multi_label: false,
    },
  );

  const latency = performance.now() - startTime;
  const topLabel = result.labels[0];
  const confidence = result.scores[0];

  // ✅ Map to intent
  let intent: "generic" | "follow_up" | "tool_needed";

  if (topLabel.includes("greeting") || topLabel.includes("acknowledgment")) {
    intent = "generic";
  } else if (topLabel.includes("follow")) {
    intent = "follow_up";
  } else {
    intent = "tool_needed";
  }

  console.log(
    `🎯 Intent: ${intent} (${(confidence * 100).toFixed(1)}%) in ${latency.toFixed(0)}ms`,
  );

  return {intent, confidence};
}
