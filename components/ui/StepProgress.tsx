"use client";

import {
  CheckCircle2,
  Loader2,
  XCircle,
  Search,
  Brain,
  Sparkles,
} from "lucide-react";

type StepStatus = "pending" | "active" | "complete" | "error";
const stepDefinitions: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  processing: { label: "Processing", icon: <Brain size={16} /> },
  searching: { label: "Searching knowledge", icon: <Search size={16} /> },
  generating: { label: "Generating response", icon: <Sparkles size={16} /> },
  error: { label: "An error occurred", icon: <XCircle size={16} /> },
};

export function StepProgress({
  currentSteps,
  embed
}: {
  currentSteps: Record<string, StepStatus>;
  embed:boolean;
}) {
  console.log("🎨 StepProgress render:", currentSteps);

  const activeStepKeys = Object.keys(currentSteps).filter(
    (key) => currentSteps[key] !== "pending",
  );

  console.log("🔑 Active step keys:", activeStepKeys);

  if (activeStepKeys.length === 0) {
    console.log("⚠️ No active steps, returning null");
    return null;
  }

  // Update sortOrder to include it
  const sortOrder = ["processing", "searching", "generating"];

  const sortedKeys = activeStepKeys.sort((a, b) => {
    const aIndex = sortOrder.indexOf(a);
    const bIndex = sortOrder.indexOf(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  console.log("📊 Sorted keys:", sortedKeys);

  // ✅ Hide spinner when all steps complete
  const allComplete = sortedKeys.every(
    (key) => currentSteps[key] === "complete",
  );

  return (
    <div className="flex items-start gap-3 animate-fade-in mb-2">
      {!allComplete && !embed && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Loader2 size={14} className="text-primary animate-spin" />
        </div>
      )}

      <div className="flex-1 bg-card/50 border border-border rounded-2xl rounded-tl-none p-4 space-y-2">
        {sortedKeys.map((stepKey) => {
          const status = currentSteps[stepKey];
          const stepDef = stepDefinitions[stepKey] || {
            label: stepKey,
            icon: <Brain size={16} />,
          };

          console.log(`  ➡️ Rendering step: ${stepKey} (${status})`);

          return (
            <div key={stepKey} className="flex items-center gap-2.5">
              {/* Status Icon */}
              <div className="shrink-0">
                {status === "active" && (
                  <Loader2 size={16} className="text-primary animate-spin" />
                )}
                {status === "complete" && (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                )}
                {status === "error" && (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`text-sm transition-colors ${
                  status === "active"
                    ? "text-foreground font-medium"
                    : status === "complete"
                      ? "text-muted-foreground"
                      : "text-red-500"
                }`}
              >
                {stepDef.label}
              </span>

              {/* Animated Dots for Active */}
              {status === "active" && (
                <span className="text-muted-foreground text-xs animate-pulse">
                  ...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
