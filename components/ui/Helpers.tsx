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

function calculateOverallScore(overall: CustomOverall): number {
  const score =
    overall.semantic_similarity * 60 +
    overall.keyword_recall * 20 + // Adjusted weight
    ((overall.context_precision + overall.context_recall) / 2) * 20;
  return Math.round(score);
}

function calculateTestScore(row: CustomRow): number {
  const score =
    // row.exact_match * 25 +  <-- REMOVED
    row.semantic_similarity * 50 + // Increased weight
    row.keyword_recall * 20 +
    ((row.context_precision + row.context_recall) / 2) * 30;
  return Math.round(score);
}
function getPerformanceLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

function getScoreColor(score: number): string {
  if (score >= 90)
    return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
  if (score >= 75)
    return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
  if (score >= 60)
    return "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20";
  return "bg-red-500/10 text-red-600 border border-red-500/20";
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(score)}`}
    >
      {score}% {getPerformanceLabel(score)}
    </div>
  );
}

const convertTOSeconds = (ms: number) => {
  return (ms / 1000).toFixed(2);
};

export {
  ScoreBadge,
  getPerformanceLabel,
  getScoreColor,
  calculateOverallScore,
  calculateTestScore,
  convertTOSeconds,
};
