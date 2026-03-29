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
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* Dark Header Ledger */}
      <div className="bg-[#1A1714] px-4 py-2 opacity-95">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#EAB564]">
          {label}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="p-4 flex items-center justify-between">
        <div className={`shrink-0 p-2 rounded-lg ${variants[variant]}`}>
          <Icon className="text-xl" />
        </div>
        
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default StatCard;
