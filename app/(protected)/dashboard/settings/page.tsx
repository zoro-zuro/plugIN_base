"use client";

import { useState } from "react";
import { generateResponse } from "@/app/actions/message";
import { useUser } from "@clerk/nextjs";

type TestCase = {
  question: string;
  groundTruth: string;
};

type EvalRow = {
  id: number;
  question: string;
  groundTruth: string;
  answer: string;
  latencyMs: number;
  contexts?: { text: string; metadata: any }[];
};

type CustomOverall = {
  exact_match: number;
  semantic_similarity: number; // Changed from fuzzy_f1
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type CustomRow = {
  question: string;
  exact_match: number;
  semantic_similarity: number; // Changed from fuzzy_f1
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

export default function SettingsPage() {
  const [rawCases, setRawCases] = useState("");
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useUser();
  const userId = user?.id || "anonymous";
  const [evalOverall, setEvalOverall] = useState<CustomOverall | null>(null);
  const [evalRows, setEvalRows] = useState<CustomRow[]>([]);
  const [isEvalRunning, setIsEvalRunning] = useState(false);

  const parseTestCases = (): TestCase[] => {
    return rawCases
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [q, a] = line.split("|");
        return {
          question: (q || "").trim(),
          groundTruth: (a || "").trim(),
        };
      })
      .filter((tc) => tc.question && tc.groundTruth);
  };

  const handleRun = async () => {
    const tests = parseTestCases();
    if (tests.length === 0) {
      alert(
        "Please add at least one test case in format: Question | Ground truth answer",
      );
      return;
    }

    setIsRunning(true);
    setRows([]);

    const out: EvalRow[] = [];

    for (let i = 0; i < tests.length; i++) {
      const tc = tests[i];
      try {
        const start = performance.now();
        const res = await generateResponse(tc.question, {
          evalMode: true,
          namespace: userId,
          sessionId: "eval-session",
        });
        const end = performance.now();
        const latency = end - start;

        const answer = res.success ? res.answer : `Error: ${res.error}`;

        // res.contexts contains full docs from kbTool; map to safe shape
        const contexts =
          res.success && Array.isArray(res.contexts)
            ? res.contexts.map((d: any) => {
                console.log("Context item:", d, typeof d); // ← Add this
                return {
                  text: d.pageContent ?? d ?? "", // ← Handle both cases
                  metadata: d.metadata ?? {},
                };
              })
            : [];

        if (!res.success) {
          out.push({
            id: i,
            question: tc.question,
            groundTruth: tc.groundTruth,
            answer: `Error: ${res.error ?? "Unknown error"}`,
            latencyMs: latency,
          });
          continue;
        }

        out.push({
          id: i,
          question: tc.question,
          groundTruth: tc.groundTruth,
          answer: res.answer || "",
          contexts,
          latencyMs: latency,
        });
      } catch (err) {
        out.push({
          id: i,
          question: tc.question,
          groundTruth: tc.groundTruth,
          answer: "Exception while calling generateResponse",
          contexts: [],
          latencyMs: 0,
        });
      }
    }

    setRows(out);
    setIsRunning(false);
  };

  const handleDownloadJSON = () => {
    if (rows.length === 0) {
      alert("No evaluation data to download. Run evaluation first.");
      return;
    }

    // Ragas-style dataset: list of {question, answer, contexts, ground_truth}
    const ragasDataset = rows.map((r) => ({
      question: r.question,
      answer: r.answer,
      contexts: r.contexts, // from generateEvalResponse
      ground_truth: r.groundTruth,
      latency_ms: r.latencyMs,
    }));

    const blob = new Blob([JSON.stringify(ragasDataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ragas_eval_dataset.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunCustomEval = async () => {
    if (rows.length === 0) {
      alert("Run generation first to create evaluation data.");
      return;
    }

    const dataset = rows.map((r) => ({
      question: r.question,
      answer: r.answer,
      contexts: (r.contexts || []).map((c) => c.text),
      ground_truth: r.groundTruth,
      latency_ms: r.latencyMs,
    }));

    setIsEvalRunning(true);
    setEvalOverall(null);
    setEvalRows([]);
    try {
      const res = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataset),
      });

      const json = await res.json();
      setIsEvalRunning(false);

      if (!json.success) {
        alert("Custom eval failed: " + (json.error || "Unknown error"));
        return;
      }

      setEvalOverall(json.data.overall);
      setEvalRows(json.data.rows);
    } catch (error) {
      alert("Custom eval failed: " + (error as Error).message);
      setIsEvalRunning(false);
    } finally {
      setIsEvalRunning(false);
    }
  };

  const avgLatency =
    rows.length === 0
      ? 0
      : rows.reduce((sum, r) => sum + r.latencyMs, 0) / rows.length;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              RAG Evaluation (Ragas export)
            </h1>
            <p className="text-sm text-muted-foreground">
              Paste test cases, run the agent, then download a JSON file ready
              for Ragas (fields: question, answer, contexts, ground_truth,
              latency_ms).
            </p>
          </div>
          <button
            onClick={handleDownloadJSON}
            disabled={rows.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground disabled:opacity-50"
          >
            Download JSON
          </button>
          <button
            onClick={handleRunCustomEval}
            disabled={rows.length === 0 || isEvalRunning}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50"
          >
            {isEvalRunning ? "Running metrics..." : "Run custom eval"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Test cases (one per line, format: Question | Ground truth answer)
          </label>
          <textarea
            className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={
              "Who is the account manager of cust_001? | Priya Sharma\n" +
              "What is the annual revenue of cust_001? | USD 450 Million"
            }
            value={rawCases}
            onChange={(e) => setRawCases(e.target.value)}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          {isRunning ? "Running evaluation..." : "Run evaluation"}
        </button>

        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Total test cases
                </p>
                <p className="text-lg font-semibold">{rows.length}</p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Average latency
                </p>
                <p className="text-lg font-semibold">
                  {(avgLatency / 1000).toFixed(2)} s
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="border border-border rounded-md bg-card p-3 text-sm space-y-1"
                >
                  <p>
                    <span className="font-semibold">Q:</span> {r.question}
                  </p>
                  <p>
                    <span className="font-semibold">Ground truth:</span>{" "}
                    {r.groundTruth}
                  </p>
                  <p>
                    <span className="font-semibold">Model answer:</span>{" "}
                    {r.answer}
                  </p>
                  <p>
                    <span className="font-semibold">Latency:</span>{" "}
                    {(r.latencyMs / 1000).toFixed(2)} s
                  </p>
                  {/* <p>
                    <span className="font-semibold">Contexts:</span>
                    {!r.contexts || r.contexts.length === 0 ? (
                      " None"
                    ) : (
                      <span>
                        {" "}
                        {r.contexts.map((context, idx) => {
                          const text =
                            typeof context === "object" &&
                            context !== null &&
                            "text" in context
                              ? context.text
                              : String(context);

                          return (
                            <span key={idx}>
                              {idx > 0 && " | "}
                              {text} <br /> <br />
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </p> */}

                  {r.contexts && r.contexts.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Retrieved contexts:
                      </p>
                      {r.contexts.map((c, idx) => {
                        // c may be { text: "...", metadata: { ... } } or a plain string
                        if (
                          typeof c === "object" &&
                          c !== null &&
                          "text" in c
                        ) {
                          const meta = c.metadata || {};
                          const fileName =
                            meta.fileName || meta.source || "Unknown file";
                          const pageNumber =
                            meta.pageNumber ?? meta.page ?? undefined;

                          return (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground"
                            >
                              <p className="font-medium">
                                {/* Always show the file label, but user still sees the text below */}
                                {fileName}
                                {pageNumber !== undefined &&
                                  ` — page ${pageNumber}`}
                              </p>
                              <p className="line-clamp-2">{c.text}</p>
                            </div>
                          );
                        } else {
                          // It's a plain string, show text
                          return (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground"
                            >
                              <p className="line-clamp-2">{String(c)}</p>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {evalOverall && (
          <div className="mt-8 space-y-6">
            {/* Overall Performance Card */}
            <div className="rounded-xl border-2 border-border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Overall Performance</h2>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-600">
                    {calculateOverallScore(evalOverall)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getPerformanceLabel(calculateOverallScore(evalOverall))}
                  </div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${getScoreColor(calculateOverallScore(evalOverall))}`}
                  style={{ width: `${calculateOverallScore(evalOverall)}%` }}
                />
              </div>
            </div>

            {/* Metrics Grid with Visual Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Answer Quality */}

              {/* Answer Relevance */}
              <MetricCard
                title="Answer Relevance"
                description="How semantically similar answers are to ground truth"
                score={evalOverall.semantic_similarity * 100}
                icon="🎯"
              />

              {/* Keyword Coverage */}
              <MetricCard
                title="Keyword Coverage"
                description="Important keywords included in answers"
                score={
                  ((evalOverall.keyword_precision +
                    evalOverall.keyword_recall) /
                    2) *
                  100
                }
                icon="🔑"
              />

              {/* Context Usage */}
              <MetricCard
                title="Context Usage"
                description="How well the bot uses retrieved information"
                score={
                  ((evalOverall.context_precision +
                    evalOverall.context_recall) /
                    2) *
                  100
                }
                icon="📚"
              />

              {/* Response Speed */}
              <MetricCard
                title="Response Speed"
                description="Average time to generate answers"
                score={getSpeedScore(evalOverall.latency_ms)}
                value={`${(evalOverall.latency_ms / 1000).toFixed(1)}s`}
                icon="⚡"
              />

              {/* Overall Accuracy */}
              <MetricCard
                title="Overall Accuracy"
                description="Combined score across all quality metrics"
                score={calculateOverallScore(evalOverall)}
                icon="📊"
              />
            </div>

            {/* Individual Test Results */}
            {evalRows.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Individual Test Results
                </h3>
                <div className="space-y-3">
                  {evalRows.map((r, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg bg-card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm flex-1">
                          {r.question}
                        </p>
                        <div className="ml-4">
                          <ScoreBadge score={calculateTestScore(r)} />
                        </div>
                      </div>

                      {/* Mini metrics bar */}
                      <div className="flex gap-2 mt-3">
                        <MiniMetric label="Exact Match" value={r.exact_match} />
                        <MiniMetric
                          label="Relevance"
                          value={r.semantic_similarity}
                        />
                        <MiniMetric
                          label="Keywords"
                          value={(r.keyword_precision + r.keyword_recall) / 2}
                        />
                        <MiniMetric
                          label="Context"
                          value={(r.context_precision + r.context_recall) / 2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// Helper Functions
function calculateOverallScore(overall: CustomOverall): number {
  // Semantic similarity is now the PRIMARY metric (60% weight)
  const score =
    overall.semantic_similarity * 60 + // Main metric!
    ((overall.keyword_precision + overall.keyword_recall) / 2) * 20 +
    ((overall.context_precision + overall.context_recall) / 2) * 20;
  return Math.round(score);
}

function calculateTestScore(row: CustomRow): number {
  const score =
    row.exact_match * 25 +
    row.semantic_similarity * 35 +
    ((row.keyword_precision + row.keyword_recall) / 2) * 20 +
    ((row.context_precision + row.context_recall) / 2) * 20;
  return Math.round(score);
}

function getPerformanceLabel(score: number): string {
  if (score >= 90) return "🎉 Excellent";
  if (score >= 75) return "👍 Good";
  if (score >= 60) return "⚠️ Fair";
  if (score >= 40) return "⚠️ Needs Improvement";
  return "❌ Poor";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getSpeedScore(latencyMs: number): number {
  if (latencyMs < 2000) return 100;
  if (latencyMs < 5000) return 80;
  if (latencyMs < 10000) return 60;
  if (latencyMs < 15000) return 40;
  return 20;
}

// Metric Card Component
function MetricCard({
  title,
  description,
  score,
  value,
  icon,
}: {
  title: string;
  description: string;
  score: number;
  value?: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-bold">
            {value || `${Math.round(score)}%`}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {getPerformanceLabel(score).split(" ")[1]}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${getScoreColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Score Badge Component
function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const bgColor = color.replace("bg-", "bg-").replace("-500", "-100");
  const textColor = color.replace("bg-", "text-");

  return (
    <div
      className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-xs font-semibold`}
    >
      {score}% {getPerformanceLabel(score).split(" ")[0]}
    </div>
  );
}

// Mini Metric Component
function MiniMetric({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const color = getScoreColor(percentage);

  return (
    <div className="flex-1">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
