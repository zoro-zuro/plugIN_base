import { Logo } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F7F4EF]">
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Logo */}
        <div className="relative group">
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_linear_infinite]" />
          <div className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_linear_infinite]" />
          
          <div className="relative p-6 rounded-3xl bg-white border border-border shadow-[0_20px_50px_rgba(26,23,20,0.08)] group-hover:shadow-primary/10 transition-shadow">
            <Logo className="h-12 w-12 animate-pulse" />
          </div>
        </div>

        {/* Brand signature */}
        <div className="flex flex-col items-center gap-2">
          <span style={{ fontFamily: 'Georgia, serif' }} className="text-3xl font-black tracking-tight text-[#1A1714]">
            PluginBase
          </span>
          <div className="flex items-center gap-1.5 h-1">
             <div className="w-12 h-[2px] bg-border overflow-hidden rounded-full">
                <div className="w-full h-full bg-primary animate-[shimmerOnce_1.5s_infinite]" />
             </div>
          </div>
        </div>
      </div>

      {/* Subtle loader footer */}
      <div className="fixed bottom-12 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C7B68] animate-pulse">
          Initializing Intelligence
        </span>
      </div>
    </div>
  );
}
