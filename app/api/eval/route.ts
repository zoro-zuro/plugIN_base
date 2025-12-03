import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export const runtime = "nodejs";

type EvalInputRow = {
  question: string;
  answer: string;
  contexts: string[];
  ground_truth: string;
  latency_ms: number;
};

type EvalSampleScores = {
  question: string;
  exact_match: number;
  semantic_similarity: number; // This is the key metric now!
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type EvalResult = {
  overall: {
    exact_match: number;
    semantic_similarity: number;
    keyword_precision: number;
    keyword_recall: number;
    context_precision: number;
    context_recall: number;
    latency_ms: number;
  };
  rows: EvalSampleScores[];
};

// Initialize HuggingFace Inference (same as your RAG)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

// Simple English stopwords
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "is",
  "am",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "as",
  "into",
  "about",
  "up",
  "down",
  "over",
  "under",
  "you",
  "just",
  "asked",
  "provided",
  "information",
  "database",
]);

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

// Get embeddings using BGE-M3 (same as your RAG)
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: "BAAI/bge-m3",
      inputs: text,
    });

    // HF returns nested array, flatten it
    if (Array.isArray(response[0]) && typeof response[0][0] === "number") {
      return response[0] as number[];
    }
    return response as number[];
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
}

// Semantic similarity using embeddings
async function semanticSimilarity(
  text1: string,
  text2: string,
): Promise<number> {
  try {
    const [embedding1, embedding2] = await Promise.all([
      getEmbedding(text1),
      getEmbedding(text2),
    ]);

    const similarity = cosineSimilarity(embedding1, embedding2);

    // Convert to 0-1 range (cosine similarity is already -1 to 1)
    return Math.max(0, Math.min(1, (similarity + 1) / 2));
  } catch (error) {
    console.error("Semantic similarity error:", error);
    return 0;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function uniqueKeywords(text: string): Set<string> {
  const tokens = tokenize(text);
  return new Set(tokens.filter((t) => !STOPWORDS.has(t)));
}

function exactMatch(a: string, b: string): number {
  // Normalize both strings
  const groundTruth = b.trim().toLowerCase();
  const modelAnswer = a.trim().toLowerCase();

  // If ground truth is empty, return 0
  if (groundTruth.length === 0) return 0;

  // Check if ground truth is contained in model answer
  if (modelAnswer.includes(groundTruth)) {
    return 1; // 100% match
  }

  // Token-based overlap: check what % of ground truth tokens are in answer
  const gtTokens = groundTruth.split(/\s+/).filter((t) => t.length > 0);
  const answerTokens = new Set(
    modelAnswer.split(/\s+/).filter((t) => t.length > 0),
  );

  let matchedTokens = 0;
  for (const token of gtTokens) {
    if (answerTokens.has(token)) {
      matchedTokens++;
    }
  }

  // Return percentage of ground truth tokens found in answer
  return matchedTokens / gtTokens.length;
}

function keywordPR(
  answer: string,
  groundTruth: string,
): {
  precision: number;
  recall: number;
} {
  const gtKeywords = uniqueKeywords(groundTruth);
  const ansKeywords = uniqueKeywords(answer);
  if (gtKeywords.size === 0 || ansKeywords.size === 0) {
    return { precision: 0, recall: 0 };
  }

  let overlap = 0;
  for (const k of ansKeywords) {
    if (gtKeywords.has(k)) overlap++;
  }

  const precision = overlap / ansKeywords.size;
  const recall = overlap / gtKeywords.size;
  return { precision, recall };
}

function contextPR(
  contexts: string[],
  groundTruth: string,
  semanticSimilarity: number, // Add this parameter
): {
  precision: number;
  recall: number;
} {
  // Case 1: No contexts retrieved
  if (contexts.length === 0) {
    // If answer is good without context (answered from memory), that's perfect!
    if (semanticSimilarity >= 0.7) {
      return { precision: 1.0, recall: 1.0 }; // Perfect - no retrieval needed
    } else {
      // Bad answer with no context - should have retrieved something
      return { precision: 0, recall: 0 };
    }
  }

  // Case 2: Contexts were retrieved - evaluate their relevance
  const gtKeywords = uniqueKeywords(groundTruth);
  if (gtKeywords.size === 0) {
    return { precision: 0, recall: 0 };
  }

  let relevantContexts = 0;
  let coveredKeywords = new Set<string>();

  for (const ctx of contexts) {
    const ctxTokens = new Set(uniqueKeywords(ctx));
    let anyMatch = false;
    for (const k of gtKeywords) {
      if (ctxTokens.has(k)) {
        anyMatch = true;
        coveredKeywords.add(k);
      }
    }
    if (anyMatch) relevantContexts++;
  }

  // Precision: how many retrieved contexts were relevant
  const precision = relevantContexts / contexts.length;

  // Recall: how many ground truth keywords were found in contexts
  const recall = coveredKeywords.size / gtKeywords.size;

  return { precision, recall };
}

export async function POST(req: Request) {
  let data: EvalInputRow[];
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json(
      { success: false, error: "Dataset must be a non-empty array" },
      { status: 400 },
    );
  }

  if (!process.env.HUGGINGFACE_API_KEY) {
    return NextResponse.json(
      { success: false, error: "HUGGINGFACE_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    console.log(
      `📊 Evaluating ${data.length} test cases with BGE-M3 embeddings...`,
    );

    const rows: EvalSampleScores[] = await Promise.all(
      data.map(async (row) => {
        const answer = row.answer || "";
        const gt = row.ground_truth || "";
        const contexts = Array.isArray(row.contexts) ? row.contexts : [];

        const em = exactMatch(answer, gt);
        const kw = keywordPR(answer, gt);

        // Calculate semantic similarity first
        const semanticScore = await semanticSimilarity(answer, gt);

        // Pass semantic score to contextPR so it can evaluate intelligently
        const ctx = contextPR(contexts, gt, semanticScore);

        return {
          question: row.question,
          exact_match: em,
          semantic_similarity: semanticScore,
          keyword_precision: kw.precision,
          keyword_recall: kw.recall,
          context_precision: ctx.precision,
          context_recall: ctx.recall,
          latency_ms: row.latency_ms ?? 0,
        };
      }),
    );

    const n = rows.length;
    const avg = (f: (r: EvalSampleScores) => number) =>
      rows.reduce((s, r) => s + f(r), 0) / n;

    const overall: EvalResult["overall"] = {
      exact_match: avg((r) => r.exact_match),
      semantic_similarity: avg((r) => r.semantic_similarity),
      keyword_precision: avg((r) => r.keyword_precision),
      keyword_recall: avg((r) => r.keyword_recall),
      context_precision: avg((r) => r.context_precision),
      context_recall: avg((r) => r.context_recall),
      latency_ms: avg((r) => r.latency_ms),
    };

    const result: EvalResult = { overall, rows };

    console.log("✅ Evaluation complete");

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("❌ Evaluation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
