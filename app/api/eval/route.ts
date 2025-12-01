import { NextResponse } from "next/server";
import { pipeline } from "@xenova/transformers";

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
  fuzzy_f1: number;
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type EvalResult = {
  overall: {
    exact_match: number;
    fuzzy_f1: number;
    keyword_precision: number;
    keyword_recall: number;
    context_precision: number;
    context_recall: number;
    latency_ms: number;
  };
  rows: EvalSampleScores[];
};

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
]);

// Initialize embedding model once (lazy loading)
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Embedding model loaded");
  }
  return embedder;
}

async function semanticSimilarity(
  text1: string,
  text2: string,
): Promise<number> {
  try {
    const model = await getEmbedder();

    const [output1, output2] = await Promise.all([
      model(text1, { pooling: "mean", normalize: true }),
      model(text2, { pooling: "mean", normalize: true }),
    ]);

    const e1 = Array.from(output1.data);
    const e2 = Array.from(output2.data);

    // Cosine similarity (embeddings are already normalized)
    let dotProduct = 0;
    for (let i = 0; i < e1.length; i++) {
      dotProduct += (e1 as any)[i] * (e2 as any)[i];
    }

    return Math.max(0, Math.min(1, dotProduct)); // Clamp to [0, 1]
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
  return a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
}

function fuzzyF1(answer: string, groundTruth: string): number {
  const ansTokens = tokenize(answer);
  const gtTokens = tokenize(groundTruth);
  if (gtTokens.length === 0 || ansTokens.length === 0) return 0;

  const ansCounts: Record<string, number> = {};
  const gtCounts: Record<string, number> = {};

  for (const t of ansTokens) ansCounts[t] = (ansCounts[t] || 0) + 1;
  for (const t of gtTokens) gtCounts[t] = (gtCounts[t] || 0) + 1;

  let overlap = 0;
  for (const t of Object.keys(gtCounts)) {
    if (ansCounts[t]) {
      overlap += Math.min(ansCounts[t], gtCounts[t]);
    }
  }

  const precision = overlap / ansTokens.length;
  const recall = overlap / gtTokens.length;
  if (precision === 0 && recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
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
): {
  precision: number;
  recall: number;
} {
  const gtKeywords = uniqueKeywords(groundTruth);
  if (gtKeywords.size === 0 || contexts.length === 0) {
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

  const precision = relevantContexts / contexts.length;
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

  try {
    console.log(`📊 Evaluating ${data.length} test cases...`);

    const rows: EvalSampleScores[] = await Promise.all(
      data.map(async (row) => {
        const answer = row.answer || "";
        const gt = row.ground_truth || "";
        const contexts = Array.isArray(row.contexts) ? row.contexts : [];

        const em = exactMatch(answer, gt);
        const f1 = fuzzyF1(answer, gt);
        const kw = keywordPR(answer, gt);
        const ctx = contextPR(contexts, gt);

        // Semantic similarity using local embeddings (no API key needed!)
        const semanticScore = await semanticSimilarity(answer, gt);

        // Use semantic similarity as fuzzy_f1 for better accuracy
        return {
          question: row.question,
          exact_match: em,
          fuzzy_f1: semanticScore, // ✨ Enhanced with semantic similarity
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
      fuzzy_f1: avg((r) => r.fuzzy_f1),
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
