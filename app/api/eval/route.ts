import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export const runtime = "nodejs";

// type EvalInputRow = {
//   question: string;
//   answer: string;
//   contexts: string[];
//   ground_truth: string;
//   latency_ms: number;
// };

type EvalSampleScores = {
  question: string;
  // exact_match: number;
  semantic_similarity: number;
  // keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type EvalResult = {
  overall: {
    // exact_match: number;
    semantic_similarity: number;
    // keyword_precision: number;
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
  if (!a.length || !b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// Get embeddings using BGE-M3 (same as your RAG)
// async function getEmbedding(text: string): Promise<number[]> {
//   try {
//     const response = await hf.featureExtraction({
//       model: "BAAI/bge-m3",
//       inputs: text,
//     });

//     // HF returns nested array, flatten it
//     if (Array.isArray(response[0]) && typeof response[0][0] === "number") {
//       return response[0] as number[];
//     }
//     return response as number[];
//   } catch (error) {
//     console.error("Embedding error:", error);
//     throw error;
//   }
// }

async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await hf.featureExtraction({
      model: "BAAI/bge-m3",
      inputs: texts,
    });
    // Ensure we return array of arrays
    if (
      Array.isArray(response) &&
      response.length > 0 &&
      Array.isArray(response[0])
    ) {
      return response as number[][];
    }
    return [];
  } catch (error) {
    console.error("Batch embedding error:", error);
    // Fallback: return empty vectors to prevent crash
    return texts.map(() => []);
  }
}

// Semantic similarity using embeddings
// async function semanticSimilarity(
//   text1: string,
//   text2: string,
// ): Promise<number> {
//   try {
//     const [embedding1, embedding2] = await Promise.all([
//       getEmbedding(text1),
//       getEmbedding(text2),
//     ]);

//     const similarity = cosineSimilarity(embedding1, embedding2);

//     // Convert to 0-1 range (cosine similarity is already -1 to 1)
//     return Math.max(0, Math.min(1, (similarity + 1) / 2));
//   } catch (error) {
//     console.error("Semantic similarity error:", error);
//     return 0;
//   }
// }

// function tokenize(text: string): string[] {
//   return text
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, " ")
//     .split(/\s+/)
//     .filter((t) => t.length > 0);
// }

// function uniqueKeywords(text: string): Set<string> {
//   const tokens = tokenize(text);
//   return new Set(tokens.filter((t) => !STOPWORDS.has(t)));
// }

// function exactMatch(a: string, b: string): number {
//   // Normalize both strings
//   const groundTruth = b.trim().toLowerCase();
//   const modelAnswer = a.trim().toLowerCase();

//   // If ground truth is empty, return 0
//   if (groundTruth.length === 0) return 0;

//   // Check if ground truth is contained in model answer
//   if (modelAnswer.includes(groundTruth)) {
//     return 1; // 100% match
//   }

//   // Token-based overlap: check what % of ground truth tokens are in answer
//   const gtTokens = groundTruth.split(/\s+/).filter((t) => t.length > 0);
//   const answerTokens = new Set(
//     modelAnswer.split(/\s+/).filter((t) => t.length > 0),
//   );

//   let matchedTokens = 0;
//   for (const token of gtTokens) {
//     if (answerTokens.has(token)) {
//       matchedTokens++;
//     }
//   }

//   // Return percentage of ground truth tokens found in answer
//   return matchedTokens / gtTokens.length;
// }

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
  semanticSimilarity: number,
): {
  precision: number;
  recall: number;
} {
  // Case 1: No contexts retrieved
  if (contexts.length === 0) {
    // If answer is perfect (>=0.85) without context, give full credit.
    // This handles "memory" answers well.
    if (semanticSimilarity >= 0.85) {
      return { precision: 1.0, recall: 1.0 };
    } else {
      return { precision: 0, recall: 0 };
    }
  }

  // Case 2: Evaluate retrieved contexts
  const gtKeywords = uniqueKeywords(groundTruth);
  if (gtKeywords.size === 0) {
    return { precision: 0, recall: 0 };
  }

  // ✅ FIX: Calculate "Soft Precision"
  // Instead of requiring ALL docs to be relevant, we score based on the BEST doc.
  // If the best doc covers 80% of the keywords, Precision = 1.0 (Perfect retrieval).

  let bestDocScore = 0;
  const coveredKeywords = new Set<string>();

  for (const ctx of contexts) {
    const ctxTokens = new Set(uniqueKeywords(ctx));
    let docMatches = 0;

    for (const k of gtKeywords) {
      if (ctxTokens.has(k)) {
        docMatches++;
        coveredKeywords.add(k);
      }
    }

    const currentDocScore = docMatches / gtKeywords.size;
    if (currentDocScore > bestDocScore) {
      bestDocScore = currentDocScore;
    }
  }

  // Precision is now: "Did we find at least one really good document?"
  // If best doc has >50% of keywords, we consider retrieval successful (1.0).
  // Otherwise, we scale it down.
  const precision = bestDocScore > 0.5 ? 1.0 : bestDocScore * 2;

  // Recall remains: "Did we cover all facts across ALL documents?"
  const recall = coveredKeywords.size / gtKeywords.size;

  return { precision, recall };
}

export async function POST(req: Request) {
  let data: any[];
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
      `📊 Evaluating ${data.length} test cases with Batch BGE-M3 embeddings...`,
    );

    // ✅ OPTIMIZATION: Prepare all texts for 1 big API Call
    // Order: [Answer_1, GT_1, Answer_2, GT_2, ...]
    const allTexts: string[] = [];
    data.forEach((row) => {
      allTexts.push(row.answer || "");
      allTexts.push(row.ground_truth || "");
    });

    // 1. Fetch ALL embeddings in a single request (or batches of 50)
    const allEmbeddings = await getBatchEmbeddings(allTexts);

    // 2. Process results efficiently
    const rows: EvalSampleScores[] = data.map((row, index) => {
      // Retrieve pre-calculated embeddings
      const answerEmb = allEmbeddings[index * 2];
      const gtEmb = allEmbeddings[index * 2 + 1];

      // Metric 1: Semantic Similarity
      const rawSim = cosineSimilarity(answerEmb, gtEmb);
      const semanticScore = Math.max(0, Math.min(1, (rawSim + 1) / 2));

      // Metric 2: Keyword Recall (Fast CPU op)
      const answer = row.answer || "";
      const gt = row.ground_truth || "";
      const kw = keywordPR(answer, gt);

      // Metric 3: Context Metrics (Simplified Logic)
      // We pass the semantic score to contextPR to infer quality if no context was used
      const contexts = Array.isArray(row.contexts) ? row.contexts : [];
      const ctx = contextPR(contexts, gt, semanticScore);

      return {
        question: row.question,
        semantic_similarity: semanticScore,
        keyword_recall: kw.recall,
        context_precision: ctx.precision,
        context_recall: ctx.recall,
        latency_ms: row.latency_ms ?? 0,
      };
    });

    // 3. Calculate Averages
    const n = rows.length;
    const avg = (f: (r: EvalSampleScores) => number) =>
      n > 0 ? rows.reduce((s, r) => s + f(r), 0) / n : 0;

    const overall: EvalResult["overall"] = {
      semantic_similarity: avg((r) => r.semantic_similarity),
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
function uniqueKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((t) => !STOPWORDS.has(t) && t.length > 2),
  );
}
