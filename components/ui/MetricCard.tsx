function MetricCard({
  title,
  score,
  icon,
}: {
  title: string;
  score: number;
  icon: any;
}) {
  return (
    <div className="rounded-xl bg-card/50 border border-border p-4 flex flex-col justify-between">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon} {title}
      </div>
      <div className="mt-2">
        <div className="text-xl font-bold text-foreground mb-1">
          {Math.round(score)}%
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
