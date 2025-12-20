import { IconType } from "react-icons";

// ✅ Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  variant = "primary",
}: {
  icon: IconType;
  label: string;
  value: number;
  variant?: "primary" | "secondary" | "accent" | "destructive";
}) {
  const variants = {
    primary: "bg-primary/10 text-primary ring-primary/20",
    secondary: "bg-secondary text-secondary-foreground ring-border",
    accent:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/20",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`inline-flex p-3 rounded-xl ring-1 ${variants[variant]} mb-4`}
      >
        <Icon className="text-xl" />
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default StatCard;
