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
  fuzzy_f1: number;
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type CustomRow = {
  question: string;
  exact_match: number;
  fuzzy_f1: number;
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
            ? res.contexts.map((d: any) => ({
                text: d.pageContent ?? "",
                metadata: d.metadata ?? {},
              }))
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

                  {r.contexts && r.contexts.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Retrieved contexts:
                      </p>
                      {r.contexts.map((c, idx) => {
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
                              {fileName}
                              {pageNumber !== undefined &&
                                ` — page ${pageNumber}`}
                            </p>
                            <p className="line-clamp-2">{c.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {evalOverall && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold">Custom evaluation metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Exact match
                </p>
                <p className="text-lg font-semibold">
                  {evalOverall.exact_match.toFixed(3) ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">Fuzzy F1</p>
                <p className="text-lg font-semibold">
                  {evalOverall.fuzzy_f1.toFixed(3) ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Keyword precision
                </p>
                <p className="text-lg font-semibold">
                  {evalOverall.keyword_precision.toFixed(3) ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Keyword recall
                </p>
                <p className="text-lg font-semibold">
                  {evalOverall.keyword_recall.toFixed(3) ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Context precision
                </p>
                <p className="text-lg font-semibold">
                  {evalOverall.context_precision.toFixed(3) ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Context recall
                </p>
                <p className="text-lg font-semibold">
                  {evalOverall.context_recall.toFixed(3) ?? 0}
                </p>
              </div>
            </div>

            {evalRows.length > 0 && (
              <div className="space-y-3">
                {evalRows.map((r, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-md bg-card p-3 text-sm space-y-1"
                  >
                    <p>
                      <span className="font-semibold">Q:</span> {r.question}
                    </p>
                    <p>Exact match: {r.exact_match.toFixed(3) ?? 0}</p>
                    <p>Fuzzy F1: {r.fuzzy_f1.toFixed(3) ?? 0}</p>
                    <p>
                      Keyword precision: {r.keyword_precision.toFixed(3) ?? 0}
                    </p>
                    <p>Keyword recall: {r.keyword_recall.toFixed(3) ?? 0}</p>
                    <p>
                      Context precision: {r.context_precision.toFixed(3) ?? 0}
                    </p>
                    <p>Context recall: {r.context_recall.toFixed(3) ?? 0}</p>
                    <p>Latency: {(r.latency_ms / 1000).toFixed(2)} s</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
