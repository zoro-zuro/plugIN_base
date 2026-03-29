"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiCode,
  FiBox,
  FiGlobe,
} from "react-icons/fi";
import { Zap } from "lucide-react";

type Framework =
  | "html"
  | "react"
  | "nextjs"
  | "vue"
  | "angular"
  | "php"
  | "react-native";

export default function DeployPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const [copied, setCopied] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<Framework>("html");

  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEmbedUrl(`${window.location.origin}/embed/${chatbotId}`);
    }
  }, [chatbotId]);

  const getEmbedCode = (framework: Framework) => {
    const scriptSrc = `${window.location.origin}/widget.js`;

    switch (framework) {
      case "html":
        return `<!-- Nexus Chatbot: Add this one-liner anywhere in your <body> -->
<script 
  src="${scriptSrc}" 
  data-bot-id="${chatbotId}" 
  async>
</script>`;

      case "react":
        return `// In your React/Next.js root layout or entry file
import Script from 'next/script'; // If using Next.js

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script 
        src="${scriptSrc}" 
        data-bot-id="${chatbotId}" 
        strategy="lazyOnload" 
      />
    </>
  );
}`;

      case "nextjs":
        return `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="${scriptSrc}" 
          data-bot-id="${chatbotId}" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}`;

      case "php":
        return `<!-- Add to your footer.php or base template -->
<script src="${scriptSrc}" data-bot-id="${chatbotId}" async></script>`;

      case "angular":
        return `// In your index.html (Angular)
<script src="${scriptSrc}" data-bot-id="${chatbotId}" async></script>`;

      default:
        return "// Universal Script (Works everywhere)\n" + `<script src="${scriptSrc}" data-bot-id="${chatbotId}" async></script>`;
    }
  };

  const frameworks = [
    { id: "html" as Framework, name: "Universal JS", icon: <FiGlobe /> },
    { id: "react" as Framework, name: "React / Next", icon: <FiBox /> },
    { id: "php" as Framework, name: "WordPress / PHP", icon: <FiBox /> },
  ];


  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedCode(selectedFramework));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestNow = () => {
    window.open(embedUrl, "_blank");
  };

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">
            Generating snippet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FiCode className="text-primary" />
          Integration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deploy <strong>{chatbot.name}</strong> to your website or app in
          seconds.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 animate-fade-in scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* 1. Quick Test — High-Fidelity Golden Horizon */}
          <section className="bg-gradient-to-br from-[#EAB564]/10 via-[#F7F4EF] to-[#EAB564]/10 border border-[#EAB564]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm overflow-hidden relative group transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#EAB564]/10 to-transparent opacity-50 translate-x-1/4 -translate-y-1/4" />
            <div className="flex-1 relative z-10">
              <h2 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-bold text-[#1A1714] mb-2 tracking-tight">
                Ready to launch?
              </h2>
              <p className="text-[#8C7B68] text-sm leading-relaxed max-w-md">
                Your intelligence is now prepared. Test the deployment in a high-fidelity live environment before embedding the agent into your architecture.
              </p>
              <div className="flex items-center gap-2 mt-5 text-[10px] font-black uppercase tracking-widest bg-white/60 p-2.5 rounded-lg border border-[#E2D9CC] w-fit shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EAB564] animate-ping" />
                <span className="truncate max-w-[250px] text-[#1A1714]">
                  Deployment Active: {embedUrl.slice(0, 35)}...
                </span>
              </div>
            </div>
            <button
              onClick={handleTestNow}
              className="px-6 py-4 bg-[#1A1714] text-[#F7F4EF] rounded-xl font-bold hover:shadow-2xl hover:shadow-[#1A1714]/20 transition-all flex items-center gap-2 shrink-0 group-hover:scale-105"
            >
              <FiExternalLink /> Protocol Live Demo
            </button>
          </section>

          {/* 2. Framework Selector */}
          {/* 2. Framework Selector — Reverted to High-Fidelity Dark Mode */}
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-4 ">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Integration Code
              </h2>
              <div className="">
                <button
                  onClick={handleCopy}
                  className="shrink-0  flex  md:hidden items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            <div className="relative group">
              {/* Glow Effect — Reverted */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl -m-1 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-all duration-500 blur-sm" />

              <div className="relative bg-[#0d1117] border border-border rounded-xl overflow-hidden shadow-2xl">
                {/* HEADERS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-muted/10 border-b border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
                    {frameworks.map((fw) => (
                      <button
                        key={fw.id}
                        onClick={() => setSelectedFramework(fw.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                          selectedFramework === fw.id
                            ? "bg-primary/20 text-primary border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:text-gray-200 hover:bg-white/5 border-transparent"
                        }`}
                      >
                        <span className="text-base">{fw.icon}</span>
                        {fw.name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="shrink-0 hidden  md:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors ml-auto"
                  >
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    {copied ? "Copied" : "Copy Code"}
                  </button>
                </div>

                <div className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500/30">
                  <p className="text-sm text-yellow-500">
                    ⚠️ Warning: Put the embed url under your .env file and load it securely.
                  </p>
                </div>

                <div className="p-0">
                  <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
                    <code>{getEmbedCode(selectedFramework)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Visual Preview — Corrected Icon */}
          <section className="pb-16">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground underline decoration-[#EAB564]/30 underline-offset-8">
              Protocol Preview
            </h2>

            <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-dashed border-[#E2D9CC] bg-[#F7F4EF]">
              {/* Drafting Grid */}
              <div className="absolute inset-0 opacity-[0.03]" 
                style={{backgroundImage: 'radial-gradient(#1A1714 1px, transparent 1px)', backgroundSize: '24px 24px'}} 
              />
              
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                <p className="rounded-lg bg-white/60 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#1A1714]">
                  Widget materialization zone
                </p>
              </div>

              {/* Launcher Preview */}
              <div className="absolute bottom-8 right-8">
                <div className="group relative cursor-pointer">
                  {/* Halo */}
                  <div className="pointer-events-none absolute inset-[-8px] rounded-full bg-radial from-[#EAB564]/30 to-transparent opacity-60 blur-md transition-all duration-500 group-hover:scale-150" />

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#1A1714] text-[#EAB564] shadow-[0_15px_35px_rgba(26,23,20,0.4)] transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-[#EAB564] group-hover:text-[#1A1714]">
                     <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                        <circle cx="19" cy="5" r="1.5" />
                        <circle cx="5" cy="19" r="1" opacity="0.6" />
                     </svg>
                  </div>

                  {/* Bubble */}
                  <div className="pointer-events-none absolute bottom-full right-0 mb-4 w-64 translate-y-2 rounded-2xl border border-[#1A1714] bg-[#1A1714] p-4 text-xs text-[#F7F4EF] opacity-0 shadow-2xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAB564] text-[#1A1714]">
                        <Zap size={14} className="fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#F7F4EF]">
                          {chatbot.name}
                        </div>
                        <div className="text-[10px] text-[#EAB564] font-black tracking-widest uppercase opacity-80">Synchronized</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 text-[11px] leading-relaxed italic border border-white/5">
                      "I'm now active on your digital corridor."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
