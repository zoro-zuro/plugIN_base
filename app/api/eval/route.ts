import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export const runtime = "nodejs";

type EvalSampleScores = {
  question: string;
  semantic_similarity: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type EvalResult = {
  overall: {
    semantic_similarity: number;
    keyword_recall: number;
    context_precision: number;
    context_recall: number;
    latency_ms: number;
  };
  rows: EvalSampleScores[];
};

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

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

async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await hf.featureExtraction({
      model: "BAAI/bge-m3",
      inputs: texts,
    });
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
    return texts.map(() => []);
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

// ✅ NEW: Smart Answer Containment Check
// If ground truth is fully contained in answer, return 1.0
function smartSemanticScore(
  answer: string,
  groundTruth: string,
  embeddingScore: number,
): number {
  // Normalize both
  const ansNorm = answer.toLowerCase().trim();
  const gtNorm = groundTruth.toLowerCase().trim();

  // Case 1: Exact substring match (e.g., "Sheik Ahamed Yasin" in "The candidate name is Sheik Ahamed Yasin.")
  if (ansNorm.includes(gtNorm)) {
    return 1.0; // 💯 Perfect Score
  }

  // Case 2: All ground truth keywords present in answer (order-independent)
  const gtKeywords = uniqueKeywords(groundTruth);
  const ansKeywords = uniqueKeywords(answer);

  if (gtKeywords.size === 0) return embeddingScore; // No keywords to check

  let matchedKeywords = 0;
  for (const keyword of gtKeywords) {
    if (ansKeywords.has(keyword)) {
      matchedKeywords++;
    }
  }

  const keywordCoverage = matchedKeywords / gtKeywords.size;

  // If answer contains ALL keywords from ground truth, score = 1.0
  if (keywordCoverage === 1.0) {
    return 1.0; // 💯 Perfect Score
  }

  // Otherwise, blend keyword coverage with embedding score
  // Give more weight to keyword coverage (80%) vs embeddings (20%)
  return Math.max(embeddingScore, keywordCoverage * 0.8 + embeddingScore * 0.2);
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
  semanticSimilarity: number,
): {
  precision: number;
  recall: number;
} {
  if (contexts.length === 0) {
    if (semanticSimilarity >= 0.85) {
      return { precision: 1.0, recall: 1.0 };
    } else {
      return { precision: 0, recall: 0 };
    }
  }

  const gtKeywords = uniqueKeywords(groundTruth);
  if (gtKeywords.size === 0) {
    return { precision: 0, recall: 0 };
  }

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

  const precision = bestDocScore > 0.5 ? 1.0 : bestDocScore * 2;
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
      `📊 Evaluating ${data.length} test cases with Smart Containment Check...`,
    );

    const allTexts: string[] = [];
    data.forEach((row) => {
      allTexts.push(row.answer || "");
      allTexts.push(row.ground_truth || "");
    });

    const allEmbeddings = await getBatchEmbeddings(allTexts);

    const rows: EvalSampleScores[] = data.map((row, index) => {
      const answerEmb = allEmbeddings[index * 2];
      const gtEmb = allEmbeddings[index * 2 + 1];

      // Raw embedding similarity
      const rawSim = cosineSimilarity(answerEmb, gtEmb);
      const embeddingScore = Math.max(0, Math.min(1, (rawSim + 1) / 2));

      const answer = row.answer || "";
      const gt = row.ground_truth || "";

      // ✅ Use Smart Scoring (checks containment first)
      const semanticScore = smartSemanticScore(answer, gt, embeddingScore);

      const kw = keywordPR(answer, gt);
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
