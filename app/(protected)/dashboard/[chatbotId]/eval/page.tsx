"use client";

import { useState, use } from "react";
import { generateResponse } from "@/app/actions/message";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  exact_match: number;
  semantic_similarity: number;
  keyword_precision: number;
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
      const generatedDataset: DatasetRow[] = [];

      for (let i = 0; i < tests.length; i++) {
        const tc = tests[i];
        try {
          const start = performance.now();
          const res = await generateResponse(tc.question, {
            evalMode: true,
            namespace: chatbot.namespace, // ✅ Use chatbot namespace
            sessionId: `eval-${chatbotId}`,
          });
          const end = performance.now();
          const latency = end - start;

          // Extract contexts with full metadata
          const contexts =
            res.success && Array.isArray(res.contexts)
              ? res.contexts.map((d: any) => ({
                  text: d.pageContent || d || "",
                  metadata: d.metadata || {},
                }))
              : [];

          generatedDataset.push({
            question: tc.question,
            answer: res.success
              ? (res.answer ?? "")
              : `Error: ${res.error ?? "Unknown error"}`,
            contexts: contexts,
            ground_truth: tc.groundTruth,
            latency_ms: latency,
          });
        } catch (err) {
          generatedDataset.push({
            question: tc.question,
            answer: "Exception while calling generateResponse",
            contexts: [],
            ground_truth: tc.groundTruth,
            latency_ms: 0,
          });
        }
      }

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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RAG Evaluation Report - ${chatbot.name} - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e293b;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .chatbot-name {
      color: #6366f1;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
    }
    .overall-score {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .overall-score h2 {
      font-size: 18px;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    .overall-score .score {
      font-size: 64px;
      font-weight: bold;
      margin: 10px 0;
    }
    .overall-score .label {
      font-size: 24px;
      opacity: 0.9;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: #fefefe;
    }
    .metric-card .icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .metric-card h3 {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .metric-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .metric-card .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .metric-card .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .bg-green { background: #10b981; }
    .bg-blue { background: #3b82f6; }
    .bg-yellow { background: #f59e0b; }
    .bg-orange { background: #f97316; }
    .bg-red { background: #ef4444; }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 24px;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .test-case {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background: #fefefe;
    }
    .test-case .question {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
    }
    .test-case .row {
      margin-bottom: 10px;
      font-size: 14px;
    }
    .test-case .label {
      font-weight: 600;
      color: #64748b;
    }
    .test-case .ground-truth {
      color: #10b981;
      font-weight: 500;
    }
    .test-case .model-answer {
      color: #3b82f6;
      font-weight: 500;
    }
    .context-item {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      padding: 12px;
      margin-top: 8px;
      border-radius: 4px;
      font-size: 13px;
    }
    .context-meta {
      color: #64748b;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .score-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      float: right;
    }
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-fair { background: #fef3c7; color: #92400e; }
    .badge-poor { background: #fee2e2; color: #991b1b; }
    .mini-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }
    .mini-metric {
      text-align: center;
    }
    .mini-metric .label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .mini-metric .value {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
    .chatbot-info {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .chatbot-info h3 {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .chatbot-info .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 5px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>RAG Evaluation Report</h1>
      <div class="chatbot-name">🤖 ${chatbot.name}</div>
      <div class="meta">
        Generated on: ${new Date().toLocaleString()} | 
        Total Tests: ${dataset.length} |
        Chatbot ID: ${chatbot.chatbotId}
      </div>
    </div>

    <!-- Chatbot Info -->
    <div class="chatbot-info">
      <h3>Chatbot Information</h3>
      <div class="info-row">
        <span>Name:</span>
        <span><strong>${chatbot.name}</strong></span>
      </div>
      <div class="info-row">
        <span>ID:</span>
        <span>de>${chatbot.chatbotId}</code></span>
      </div>
      <div class="info-row">
        <span>Namespace:</span>
        <span>de>${chatbot.namespace}</code></span>
      </div>
      ${
        chatbot.websiteUrl
          ? `
      <div class="info-row">
        <span>Website:</span>
        <span>${chatbot.websiteUrl}</span>
      </div>
      `
          : ""
      }
    </div>

    <!-- Overall Score -->
    <div class="overall-score">
      <h2>Overall Performance</h2>
      <div class="score">${overallScore}%</div>
      <div class="label">${performanceLabel}</div>
    </div>

    <!-- Metrics Grid -->
    <div class="section">
      <h2>Performance Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="icon">✓</div>
          <h3>Answer Quality</h3>
          <div class="value">${Math.round(evalResult.overall.exact_match * 100)}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(evalResult.overall.exact_match * 100)}" 
                 style="width: ${evalResult.overall.exact_match * 100}%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="icon">🎯</div>
          <h3>Answer Relevance</h3>
          <div class="value">${Math.round(evalResult.overall.semantic_similarity * 100)}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(evalResult.overall.semantic_similarity * 100)}" 
                 style="width: ${evalResult.overall.semantic_similarity * 100}%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="icon">🔑</div>
          <h3>Keyword Coverage</h3>
          <div class="value">${Math.round(((evalResult.overall.keyword_precision + evalResult.overall.keyword_recall) / 2) * 100)}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(((evalResult.overall.keyword_precision + evalResult.overall.keyword_recall) / 2) * 100)}" 
                 style="width: ${((evalResult.overall.keyword_precision + evalResult.overall.keyword_recall) / 2) * 100}%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="icon">📚</div>
          <h3>Context Usage</h3>
          <div class="value">${Math.round(((evalResult.overall.context_precision + evalResult.overall.context_recall) / 2) * 100)}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(((evalResult.overall.context_precision + evalResult.overall.context_recall) / 2) * 100)}" 
                 style="width: ${((evalResult.overall.context_precision + evalResult.overall.context_recall) / 2) * 100}%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="icon">⚡</div>
          <h3>Response Speed</h3>
          <div class="value">${(evalResult.overall.latency_ms / 1000).toFixed(1)}s</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(getSpeedScore(evalResult.overall.latency_ms))}" 
                 style="width: ${getSpeedScore(evalResult.overall.latency_ms)}%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="icon">📊</div>
          <h3>Overall Accuracy</h3>
          <div class="value">${overallScore}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${getScoreColorClass(overallScore)}" 
                 style="width: ${overallScore}%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Cases Details -->
    <div class="section">
      <h2>Test Cases & Responses</h2>
      ${dataset
        .map(
          (row, idx) => `
        <div class="test-case">
          <div class="question">
            ${idx + 1}. ${row.question}
            <span class="score-badge ${getBadgeClass(calculateTestScore(evalResult.rows[idx]))}">
              ${calculateTestScore(evalResult.rows[idx])}% ${getPerformanceLabel(calculateTestScore(evalResult.rows[idx])).split(" ")[0]}
            </span>
          </div>
          
          <div class="row">
            <span class="label">Ground Truth:</span> 
            <span class="ground-truth">${row.ground_truth}</span>
          </div>
          
          <div class="row">
            <span class="label">Model Answer:</span> 
            <span class="model-answer">${row.answer}</span>
          </div>
          
          <div class="row">
            <span class="label">Latency:</span> ${(row.latency_ms / 1000).toFixed(2)}s
          </div>

          ${
            row.contexts && row.contexts.length > 0
              ? `
          <div class="row">
            <span class="label">Retrieved Contexts (${row.contexts.length}):</span>
            ${row.contexts
              .map(
                (ctx: any) => `
              <div class="context-item">
                <div class="context-meta">
                  📄 ${ctx.metadata.fileName || ctx.metadata.source || "Unknown file"}
                  ${ctx.metadata.pageNumber !== undefined ? `— Page ${ctx.metadata.pageNumber}` : ""}
                </div>
                <div>${ctx.text.substring(0, 200)}${ctx.text.length > 200 ? "..." : ""}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

          <div class="mini-metrics">
            <div class="mini-metric">
              <div class="label">Exact Match</div>
              <div class="value">${Math.round(evalResult.rows[idx].exact_match * 100)}%</div>
            </div>
            <div class="mini-metric">
              <div class="label">Relevance</div>
              <div class="value">${Math.round(evalResult.rows[idx].semantic_similarity * 100)}%</div>
            </div>
            <div class="mini-metric">
              <div class="label">Keywords</div>
              <div class="value">${Math.round(((evalResult.rows[idx].keyword_precision + evalResult.rows[idx].keyword_recall) / 2) * 100)}%</div>
            </div>
            <div class="mini-metric">
              <div class="label">Context</div>
              <div class="value">${Math.round(((evalResult.rows[idx].context_precision + evalResult.rows[idx].context_recall) / 2) * 100)}%</div>
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  </div>
</body>
</html>
  `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation_report_${chatbot.chatbotId}_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setIsGeneratingReport(false);
  };

  // Helper function for color classes
  function getScoreColorClass(score: number): string {
    if (score >= 90) return "bg-green";
    if (score >= 75) return "bg-blue";
    if (score >= 60) return "bg-yellow";
    if (score >= 40) return "bg-orange";
    return "bg-red";
  }

  function getBadgeClass(score: number): string {
    if (score >= 90) return "badge-excellent";
    if (score >= 75) return "badge-good";
    if (score >= 60) return "badge-fair";
    return "badge-poor";
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading chatbot...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">RAG Evaluation</h1>
            <p className="text-sm text-muted-foreground">
              Testing: <strong>{chatbot.name}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadHTMLReport}
              disabled={!evalResult || isGeneratingReport}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {isGeneratingReport ? "Generating..." : "📄 Download HTML Report"}
            </button>
            <button
              onClick={handleDownloadJSON}
              disabled={!evalResult}
              className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground disabled:opacity-50 hover:bg-secondary/80 transition-colors"
            >
              📊 Download JSON
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Test cases (one per line, format: Question | Ground truth answer)
          </label>
          <textarea
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder={
              "Who is the account manager of cust_001? | Priya Sharma\n" +
              "What is the annual revenue of cust_001? | USD 450 Million"
            }
            value={rawCases}
            onChange={(e) => setRawCases(e.target.value)}
          />
        </div>

        {/* Run Button */}
        <button
          onClick={handleRunEval}
          disabled={isRunning}
          className="w-full px-6 py-3 text-base font-semibold rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {isRunning ? "Running evaluation..." : "Run Evaluation"}
        </button>

        {/* Test Cases Details (Before Metrics) */}
        {dataset.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Cases & Responses</h3>
            <div className="space-y-3">
              {dataset.map((row, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg bg-card p-4"
                >
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Question:</span>{" "}
                      {row.question}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Ground Truth:</span>{" "}
                      <span className="text-green-600 dark:text-green-400">
                        {row.ground_truth}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Model Answer:</span>{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        {row.answer}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Latency:</span>{" "}
                      {(row.latency_ms / 1000).toFixed(2)}s
                    </p>

                    {/* Contexts */}
                    {row.contexts && row.contexts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Retrieved Contexts ({row.contexts.length}):
                        </p>
                        <div className="space-y-2">
                          {row.contexts.map((ctx, ctxIdx) => {
                            const meta = ctx.metadata || {};
                            const fileName =
                              meta.fileName || meta.source || "Unknown file";
                            const pageNumber =
                              meta.pageNumber ?? meta.page ?? undefined;

                            return (
                              <div
                                key={ctxIdx}
                                className="text-xs bg-muted/50 p-2 rounded"
                              >
                                <p className="font-medium text-muted-foreground mb-1">
                                  📄 {fileName}
                                  {pageNumber !== undefined &&
                                    ` — Page ${pageNumber}`}
                                </p>
                                <p className="text-muted-foreground line-clamp-3">
                                  {ctx.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {evalResult && (
          <div className="mt-8 space-y-6">
            {/* Overall Performance Card */}
            <div className="rounded-xl border-2 border-border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Overall Performance</h2>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-600">
                    {calculateOverallScore(evalResult.overall)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getPerformanceLabel(
                      calculateOverallScore(evalResult.overall),
                    )}
                  </div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${getScoreColor(calculateOverallScore(evalResult.overall))}`}
                  style={{
                    width: `${calculateOverallScore(evalResult.overall)}%`,
                  }}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Answer Quality"
                description="How well the ground truth appears in responses"
                score={evalResult.overall.exact_match * 100}
                icon="✓"
              />

              <MetricCard
                title="Answer Relevance"
                description="How semantically similar answers are to ground truth"
                score={evalResult.overall.semantic_similarity * 100}
                icon="🎯"
              />

              <MetricCard
                title="Keyword Coverage"
                description="Important keywords included in answers"
                score={
                  ((evalResult.overall.keyword_precision +
                    evalResult.overall.keyword_recall) /
                    2) *
                  100
                }
                icon="🔑"
              />

              <MetricCard
                title="Context Usage"
                description="How well the bot uses retrieved information"
                score={
                  ((evalResult.overall.context_precision +
                    evalResult.overall.context_recall) /
                    2) *
                  100
                }
                icon="📚"
              />

              <MetricCard
                title="Response Speed"
                description="Average time to generate answers"
                score={getSpeedScore(evalResult.overall.latency_ms)}
                value={`${(evalResult.overall.latency_ms / 1000).toFixed(1)}s`}
                icon="⚡"
              />

              <MetricCard
                title="Overall Accuracy"
                description="Combined score across all quality metrics"
                score={calculateOverallScore(evalResult.overall)}
                icon="📊"
              />
            </div>

            {/* Individual Test Results */}
            {evalResult.rows.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Individual Test Scores
                </h3>
                <div className="space-y-3">
                  {evalResult.rows.map((r, idx) => (
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
  const score =
    overall.semantic_similarity * 60 +
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
