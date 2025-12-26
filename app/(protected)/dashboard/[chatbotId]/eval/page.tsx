"use client";

import { useState, use } from "react";
import { generateResponse } from "@/app/actions/norouting_message";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FiPlay,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiTarget,
  FiCpu,
  FiFileText,
} from "react-icons/fi";
import {
  ScoreBadge,
  getPerformanceLabel,
  getScoreColor,
  calculateOverallScore,
  calculateTestScore,
} from "@/components/ui/Helpers";
import MetricCard from "@/components/ui/MetricCard";

type TestCase = {
  question: string;
  groundTruth: string;
};

type DatasetRow = {
  question: string;
  answer: string;
  contexts: Array<{ text: string; metadata: any }>;
  ground_truth: string;
  latency_ms: number;
};

type CustomOverall = {
  // exact_match: number;
  semantic_similarity: number;
  // keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type CustomRow = {
  question: string;
  exact_match: number;
  semantic_similarity: number;
  keyword_precision: number;
  keyword_recall: number;
  context_precision: number;
  context_recall: number;
  latency_ms: number;
};

type EvalResult = {
  overall: CustomOverall;
  rows: CustomRow[];
};

export default function EvalPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);

  // ✅ Fetch chatbot details
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  const [rawCases, setRawCases] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [dataset, setDataset] = useState<DatasetRow[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const handleRunEval = async () => {
    if (!chatbot) {
      alert("Chatbot not loaded yet. Please wait.");
      return;
    }

    const tests = parseTestCases();
    if (tests.length === 0) {
      alert(
        "Please add at least one test case in format: Question | Ground truth answer",
      );
      return;
    }

    setIsRunning(true);
    setEvalResult(null);
    setDataset([]);

    try {
      // Step 1: Generate responses for all test cases
      let generatedDataset: DatasetRow[] = [];

      const promises = tests.map(async (tc) => {
        try {
          const start = performance.now();

          // Call the server action
          const res = await generateResponse(tc.question, {
            evalMode: true,
            test: true,
            chatbot: chatbot,
            sessionId: `eval-${chatbotId}`, // thread_id will now be randomized in backend
          });

          const end = performance.now();
          const latency = end - start;

          const contexts =
            res.success && Array.isArray(res.contexts)
              ? res.contexts.map((d: any) => ({
                  text: d.pageContent || d || "",
                  metadata: d.metadata || {},
                }))
              : [];

          return {
            question: tc.question,
            answer: res.success ? (res.answer ?? "") : `Error: ${res.error}`,
            contexts: contexts,
            ground_truth: tc.groundTruth,
            latency_ms: latency,
          };
        } catch (err) {
          console.error("Error generating response for eval:", err);
          return {
            question: tc.question,
            answer: "Exception while calling generateResponse",
            contexts: [],
            ground_truth: tc.groundTruth,
            latency_ms: 0,
          };
        }
      });
      generatedDataset = await Promise.all(promises);
      setDataset(generatedDataset);

      // Step 2: Send to evaluation API
      const evalPayload = generatedDataset.map((d) => ({
        question: d.question,
        answer: d.answer,
        contexts: d.contexts.map((c) => c.text),
        ground_truth: d.ground_truth,
        latency_ms: d.latency_ms,
      }));

      const res = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evalPayload),
      });

      const json = await res.json();

      if (!json.success) {
        alert("Evaluation failed: " + (json.error || "Unknown error"));
        setIsRunning(false);
        return;
      }

      setEvalResult(json.data);
    } catch (error) {
      alert("Evaluation failed: " + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!evalResult || dataset.length === 0) {
      alert("No evaluation data to download. Run evaluation first.");
      return;
    }

    const fullResults = {
      chatbot: {
        id: chatbot?.chatbotId,
        name: chatbot?.name,
        namespace: chatbot?.namespace,
      },
      evaluation_metrics: evalResult,
      test_cases: dataset,
      summary: {
        total_tests: dataset.length,
        overall_score: calculateOverallScore(evalResult.overall),
        performance: getPerformanceLabel(
          calculateOverallScore(evalResult.overall),
        ),
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(fullResults, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation_${chatbot?.chatbotId}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTMLReport = () => {
    if (!evalResult || dataset.length === 0 || !chatbot) {
      alert("No evaluation data to download. Run evaluation first.");
      return;
    }

    setIsGeneratingReport(true);

    const overallScore = calculateOverallScore(evalResult.overall);
    const performanceLabel = getPerformanceLabel(overallScore);

    // Simplified HTML template for brevity - logic remains the same
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>RAG Evaluation Report</title><style>body{font-family:sans-serif;padding:20px;background:#f9fafb;color:#111827}.container{max-width:1000px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}h1{color:#4f46e5;margin-bottom:10px}.score-box{background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:20px 0}.score{font-size:48px;font-weight:bold;color:#4f46e5}.metric{margin-bottom:15px}.bar{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden}.fill{height:100%;background:#4f46e5}.test-case{border:1px solid #e5e7eb;padding:15px;margin-bottom:15px;border-radius:8px}.label{font-weight:bold;color:#6b7280;font-size:12px;text-transform:uppercase}</style></head><body><div class="container"><h1>RAG Evaluation: ${chatbot.name}</h1><div class="score-box"><div class="score">${overallScore}%</div><div>${performanceLabel}</div></div><h2>Test Cases</h2>${dataset.map((row) => `<div class="test-case"><div class="label">Question</div><div>${row.question}</div><div class="label" style="margin-top:10px">Answer</div><div>${row.answer}</div><div class="label" style="margin-top:10px">Ground Truth</div><div style="color:#059669">${row.ground_truth}</div></div>`).join("")}</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation_report_${chatbot.chatbotId}_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setIsGeneratingReport(false);
  };

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">
            Loading evaluation suite...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FiTarget className="text-primary" />
            Quality Assurance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Benchmark <strong>{chatbot.name}</strong> against ground truth data.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadHTMLReport}
            disabled={!evalResult || isGeneratingReport}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FiFileText />
            {isGeneratingReport ? "Generating..." : "HTML Report"}
          </button>
          <button
            onClick={handleDownloadJSON}
            disabled={!evalResult}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FiDownload />
            JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 animate-fade-in scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Configuration Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Test Configuration
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-muted-foreground">
                Test Cases (Format: Question | Ground Truth Answer)
              </label>
              <textarea
                className="w-full min-h-[150px] rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder={`What is the return policy? | You can return items within 30 days.\nWho is the CEO? | Jane Doe.`}
                value={rawCases}
                onChange={(e) => setRawCases(e.target.value)}
              />
              <button
                onClick={handleRunEval}
                disabled={isRunning}
                className="w-full px-6 py-3.5 text-base font-bold rounded-xl bg-primary text-primary-foreground disabled:opacity-70 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <FiPlay />
                )}
                {isRunning ? "Running Evaluation..." : "Run Test Suite"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {evalResult && (
            <div className="space-y-8 animate-slide-up">
              {/* Overall Score Card */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-8">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Overall Score
                    </h2>
                    <p className="text-muted-foreground">
                      Based on accuracy, relevance, and context usage.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-primary tracking-tight">
                      {calculateOverallScore(evalResult.overall)}%
                    </div>
                    <div
                      className={`text-sm font-bold mt-1 px-3 py-1 rounded-full w-fit ml-auto ${getScoreColor(calculateOverallScore(evalResult.overall))}`}
                    >
                      {getPerformanceLabel(
                        calculateOverallScore(evalResult.overall),
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 relative z-10">
                  {/* <MetricCard
                    title="Accuracy"
                    score={evalResult.overall.exact_match * 100}
                    icon={<FiCheckCircle />}
                  /> */}
                  <MetricCard
                    title="Relevance"
                    score={evalResult.overall.semantic_similarity * 100}
                    icon={<FiTarget />}
                  />
                  {/* <MetricCard
                    title="Keywords"
                    score={
                      ((evalResult.overall.keyword_precision +
                        evalResult.overall.keyword_recall) /
                        2) *
                      100
                    }
                    icon={<FiActivity />}
                  /> */}
                  <MetricCard
                    title="Context"
                    score={
                      ((evalResult.overall.context_precision +
                        evalResult.overall.context_recall) /
                        2) *
                      100
                    }
                    icon={<FiDatabase />}
                  />
                  <div className="col-span-2 md:col-span-1 rounded-xl bg-card/50 border border-border p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FiClock /> Latency
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground">
                      {(evalResult.overall.latency_ms / 1000).toFixed(2)}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Rows */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Detailed Results
                </h3>
                <div className="space-y-4">
                  {dataset.map((row, idx) => (
                    <div
                      key={idx}
                      className="group border border-border rounded-xl bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-4 border-b border-border pb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-muted px-2.5 py-1 rounded-lg text-sm font-bold text-muted-foreground">
                            #{idx + 1}
                          </div>
                          <h4 className="font-semibold text-foreground text-lg">
                            {row.question}
                          </h4>
                        </div>
                        {evalResult?.rows[idx] && (
                          <ScoreBadge
                            score={calculateTestScore(evalResult.rows[idx])}
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* AI Response */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FiCpu /> Model Answer
                          </span>
                          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-foreground leading-relaxed">
                            {row.answer}
                          </div>
                        </div>

                        {/* Ground Truth */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FiCheckCircle /> Expected Answer
                          </span>
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-sm text-foreground leading-relaxed">
                            {row.ground_truth}
                          </div>
                        </div>
                      </div>

                      {/* Contexts Dropdown */}
                      {row.contexts.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <details className="group/ctx">
                            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2 select-none">
                              <span>
                                Show Retrieved Contexts ({row.contexts.length})
                              </span>
                            </summary>
                            <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/20">
                              {row.contexts.map((ctx, i) => (
                                <div
                                  key={i}
                                  className="text-xs text-muted-foreground bg-muted/30 p-2 rounded"
                                >
                                  <div className="font-mono text-[10px] opacity-70 mb-1">
                                    Source: {ctx.metadata.fileName || "Unknown"}
                                  </div>
                                  {ctx.text.substring(0, 150)}...
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
