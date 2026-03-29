"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import WorldGlobe from "@/components/ui/WorldGlobe";
import { 
  Upload, 
  Code, 
  BarChart3, 
  Globe2, 
  Network, 
  MessageSquare, 
  Database, 
  Bot, 
  Zap,
  Quote,
  Layout,
  Layers,
  Terminal,
  Cpu
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { IsometricCube } from "./VisualDecorations";

// --- SUB-COMPONENTS FOR CARDS ---

function DeploymentTerminal() {
  const environments = [
    {
      badge: "React",
      badgeColor: "#61DAFB",
      lines: [
        { type: "import", text: `import { PluginBase } from 'pluginbase-react';` },
        { type: "blank", text: `` },
        { type: "jsx", text: `export default function App() {` },
        { type: "jsx", text: `  return (` },
        { type: "component", text: `    <PluginBase chatbotId="bot_x72ka" />` },
        { type: "jsx", text: `  );` },
        { type: "jsx", text: `}` },
      ],
    },
    {
      badge: "Next.js",
      badgeColor: "#ffffff",
      lines: [
        { type: "comment", text: `// app/layout.tsx` },
        { type: "import", text: `import { PluginBase } from 'pluginbase-react';` },
        { type: "blank", text: `` },
        { type: "jsx", text: `export default function RootLayout({ children }) {` },
        { type: "jsx", text: `  return <>{children}` },
        { type: "component", text: `    <PluginBase chatbotId="bot_x72ka" />` },
        { type: "jsx", text: `  </>;` },
        { type: "jsx", text: `}` },
      ],
    },
    {
      badge: "Vanilla JS",
      badgeColor: "#F7DF1E",
      lines: [
        { type: "comment", text: `<!-- Drop anywhere in your HTML -->` },
        { type: "component", text: `<script` },
        { type: "component", text: `  src="https://cdn.pluginbase.ai/widget.js"` },
        { type: "component", text: `  data-bot-id="bot_x72ka"` },
        { type: "component", text: `  async` },
        { type: "component", text: `></script>` },
      ],
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const env = environments[activeIdx];
    setVisibleLines(0);
    let line = 0;
    const lineTimer = setInterval(() => {
      line++;
      setVisibleLines(line);
      if (line >= env.lines.length) {
        clearInterval(lineTimer);
        setTimeout(() => {
          setActiveIdx((prev) => (prev + 1) % environments.length);
        }, 2200);
      }
    }, 120);
    return () => clearInterval(lineTimer);
  }, [activeIdx]);

  const env = environments[activeIdx];

  const lineColor = (type: string) => {
    if (type === "import") return "text-[#C792EA]";
    if (type === "comment") return "text-[#546E7A]";
    if (type === "component") return "text-[#EAB564]";
    if (type === "blank") return "text-transparent";
    return "text-[#A6ACCD]";
  };

  return (
    <div className="w-full h-full flex flex-col justify-end pb-3">
      {/* Environment Switcher Dots — sits above terminal inside card */}
      <div className="flex items-center gap-2 justify-center pb-4">
        {environments.map((e, i) => (
          <button
            key={e.badge}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIdx ? "w-6 bg-[#EAB564]" : "w-1.5 bg-[#E2D9CC]"}`}
          />
        ))}
      </div>

      {/* Terminal Window — top radius only, bleeds into card bottom */}
      <div className="relative rounded-t-2xl overflow-hidden bg-[#0D1117] border border-b-0 border-white/5 shadow-[0_-16px_60px_rgba(0,0,0,0.35)] mx-6">
        {/* Terminal Top Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
          <div className="flex-1" />
          {/* Environment badge */}
          <AnimatePresence mode="wait">
            <motion.span
              key={env.badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
              style={{ 
                color: env.badgeColor, 
                backgroundColor: `${env.badgeColor}18`,
                border: `1px solid ${env.badgeColor}30`
              }}
            >
              {env.badge}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Code Body — static height */}
        <div className="px-5 py-5 font-mono text-[11px] leading-6 h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {env.lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={i < visibleLines ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className={`${lineColor(line.type)} whitespace-pre`}
                >
                  {line.text || " "}
                  {i === visibleLines - 1 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="inline-block w-1.5 h-3 bg-[#EAB564] ml-0.5 align-middle"
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SwipeableDeck() {
  const dataSources = [
    {
      tag: "PDF & DOCS",
      title: "Upload Documents",
      desc: "PDFs, Word docs, slide decks. Our chunking engine parses every paragraph for surgical retrieval.",
      detail: ".pdf  .docx  .pptx  .txt",
      color: "#EAB564",
    },
    {
      tag: "WEB CRAWL",
      title: "Crawl Any Website",
      desc: "Drop a URL. We recursively fetch, parse, and index your entire site — docs, blog, product pages.",
      detail: "Supports sitemaps & robots.txt",
      color: "#61DAFB",
    },
    {
      tag: "LIVE SYNC",
      title: "Notion & Google Docs",
      desc: "OAuth once. Your knowledge base stays current as your workspace documents evolve in real time.",
      detail: "Auto-syncs on every edit",
      color: "#A8E6CF",
    },
    {
      tag: "RAW TEXT",
      title: "Paste Raw Knowledge",
      desc: "FAQs, support transcripts, policy text. No formatting required — just paste your raw expertise.",
      detail: "Plain text & Markdown supported",
      color: "#C792EA",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const n = dataSources.length;
  const getCard = (offset: number) => dataSources[(currentIndex + offset) % n];

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 75 && !isFlying) {
      setIsFlying(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % n);
        x.set(0);
        setIsFlying(false);
      }, 240);
    } else {
      x.set(0);
    }
  };

  const springCfg = { type: "spring" as const, stiffness: 260, damping: 26 };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swipe hint */}
      <motion.div
        className="absolute top-4 right-6 text-[9px] text-[#9B7B4E]/40 tracking-widest uppercase font-black z-30"
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        ← swipe →
      </motion.div>

      {/* Background cards — only their tops peek above front card */}
      {[2, 1].map((offset) => (
        <motion.div
          key={`bg-${offset}-${currentIndex}`}
          className="absolute left-5 right-5 rounded-2xl bg-white border border-[#E2D9CC] overflow-hidden pointer-events-none"
          style={{ bottom: 24, zIndex: 10 - offset * 2, height: 220 }}
          animate={{
            y: isHovered
              ? offset === 1 ? -50 : -82
              : offset === 1 ? -32 : -58,
            scale: isHovered ? 0.99 : offset === 1 ? 0.97 : 0.94,
          }}
          transition={springCfg}
        >
          {/* Only the top of this card is ever visible — show accent + tag */}
          <div className="p-5 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: getCard(offset).color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#9B7B4E]/60">
              {getCard(offset).tag}
            </span>
          </div>
          {/* Subtle top separator */}
          <div className="mx-5 h-px bg-[#E2D9CC]/60" />
        </motion.div>
      ))}

      {/* Front draggable card */}
      <motion.div
        key={currentIndex}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, position: "absolute", left: 20, right: 20, bottom: 24, zIndex: 20 }}
        initial={{ y: 16, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="rounded-2xl bg-white border border-[#E2D9CC] p-6 shadow-[0_8px_40px_rgba(26,23,20,0.10)] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="h-1 w-10 rounded-full mb-4" style={{ backgroundColor: getCard(0).color }} />
        <span
          className="text-[9px] font-black uppercase tracking-widest block mb-2"
          style={{ color: getCard(0).color }}
        >
          {getCard(0).tag}
        </span>
        <h4 style={{ fontFamily: "Georgia, serif" }} className="text-[18px] font-black text-[#1A1714] mb-3 leading-snug">
          {getCard(0).title}
        </h4>
        <p className="text-[12px] text-[#8C7B68] leading-relaxed mb-5">
          {getCard(0).desc}
        </p>
        <div className="flex items-center gap-2 text-[9px] text-[#9B7B4E] font-bold uppercase tracking-widest pt-4 border-t border-[#E2D9CC]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          {getCard(0).detail}
        </div>
      </motion.div>
    </div>
  );
}

function RAGBlueprint() {
  const pathDraw = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { pathLength: { duration: 0.6, delay, ease: [0.42, 0, 0.58, 1] as [number,number,number,number] }, opacity: { duration: 0.01, delay } },
  });

  // Node: 72×36 for legibility
  const Node = ({ x, y, label, sub, gold }: { x: number; y: number; label: string; sub: string; gold?: boolean }) => (
    <g>
      <rect
        x={x} y={y} width={72} height={36} rx={5}
        fill={gold ? "rgba(234,181,100,0.10)" : "white"}
        stroke={gold ? "#EAB564" : "#1A1714"}
        strokeWidth={gold ? 1.4 : 1}
        opacity={gold ? 1 : 0.8}
      />
      {/* Corner ticks */}
      <line x1={x} y1={y+5} x2={x} y2={y} stroke={gold ? "#EAB564" : "#1A1714"} strokeWidth="0.9" opacity="0.5" />
      <line x1={x} y1={y} x2={x+5} y2={y} stroke={gold ? "#EAB564" : "#1A1714"} strokeWidth="0.9" opacity="0.5" />
      <line x1={x+68} y1={y+5} x2={x+68} y2={y} stroke={gold ? "#EAB564" : "#1A1714"} strokeWidth="0.9" opacity="0.5" />
      <line x1={x+68} y1={y} x2={x+63} y2={y} stroke={gold ? "#EAB564" : "#1A1714"} strokeWidth="0.9" opacity="0.5" />
      <text x={x+36} y={y+14} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={gold ? "#EAB564" : "#1A1714"} fontWeight="700" letterSpacing="0.5">{label}</text>
      <text x={x+36} y={y+27} textAnchor="middle" fontSize="6" fontFamily="monospace" fill={gold ? "#EAB564" : "#1A1714"} opacity="0.55" letterSpacing="0.3">{sub}</text>
    </g>
  );

  const EdgeLabel = ({ x, y, text }: { x: number; y: number; text: string }) => (
    <text x={x} y={y} textAnchor="middle" fontSize="5.5" fontFamily="monospace" fill="#1A1714" opacity="0.35" fontStyle="italic">{text}</text>
  );

  // Layout: viewBox 272×212, nodes 72×36
  // Row 1: x=8, x=100, x=192  y=10
  // Row 2: x=192, x=100, x=8  y=100
  // Row 3: x=8, x=170          y=168

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden">
      <div className="mb-2">
        <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-black text-[#1A1714] mb-1">Retrieval Pipeline</h3>
        <p className="text-xs text-[#8C7B68]">Precision RAG, precisely orchestrated.</p>
      </div>

      <div className="flex-1 relative">
        <motion.svg viewBox="0 0 272 212" className="w-full h-full">
          <defs>
            <pattern id="ragGrid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#1A1714" strokeWidth="0.18" />
            </pattern>
            <marker id="arrowInk" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#1A1714" opacity="0.5" />
            </marker>
            <marker id="arrowGold" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#EAB564" />
            </marker>
          </defs>

          <rect width="272" height="212" fill="url(#ragGrid)" opacity="0.55" />

          {/* Row 1 */}
          <Node x={8}   y={10} label="QUERY"   sub="user input" />
          <Node x={100} y={10} label="EMBED"    sub="768-dim vec" />
          <Node x={192} y={10} label="VEC DB"   sub="cloudflare" gold />
          {/* Row 2 */}
          <Node x={192} y={100} label="TOP-K"   sub="k=5 chunks" />
          <Node x={100} y={100} label="RE-RANK" sub="relevance" />
          <Node x={8}   y={100} label="INJECT"  sub="ctx window" gold />
          {/* Row 3 */}
          <Node x={8}   y={168} label="LLM"     sub="cerebras" />
          <Node x={168} y={168} label="STREAM"  sub="token / s" />

          {/* QUERY → EMBED: right(80,28) → left(100,28) */}
          <motion.path d="M 80 28 L 100 28" fill="none" stroke="#1A1714" strokeWidth="1" opacity="0.45" markerEnd="url(#arrowInk)" {...pathDraw(0.1)} />
          <EdgeLabel x={90} y={24} text="embed" />

          {/* EMBED → VEC DB: right(172,28) → left(192,28) */}
          <motion.path d="M 172 28 L 192 28" fill="none" stroke="#1A1714" strokeWidth="1" opacity="0.45" markerEnd="url(#arrowInk)" {...pathDraw(0.3)} />
          <EdgeLabel x={182} y={24} text="store" />

          {/* VEC DB ↓ TOP-K: bottom(228,46) → top(228,100) */}
          <motion.path d="M 228 46 L 228 100" fill="none" stroke="#1A1714" strokeWidth="1" opacity="0.45" markerEnd="url(#arrowInk)" {...pathDraw(0.5)} />
          <EdgeLabel x={244} y={75} text="search" />

          {/* TOP-K ← RE-RANK: left(192,118) → right(172,118) */}
          <motion.path d="M 192 118 L 172 118" fill="none" stroke="#EAB564" strokeWidth="1.2" markerEnd="url(#arrowGold)" {...pathDraw(0.7)} />
          <EdgeLabel x={182} y={114} text="cosine" />

          {/* RE-RANK → INJECT: left(100,118) → right(80,118) */}
          <motion.path d="M 100 118 L 80 118" fill="none" stroke="#EAB564" strokeWidth="1.2" markerEnd="url(#arrowGold)" {...pathDraw(0.9)} />
          <EdgeLabel x={90} y={114} text="rank" />

          {/* INJECT ↓ LLM: bottom(44,136) → top(44,168) */}
          <motion.path d="M 44 136 L 44 168" fill="none" stroke="#EAB564" strokeWidth="1.2" markerEnd="url(#arrowGold)" {...pathDraw(1.1)} />
          <EdgeLabel x={57} y={154} text="prompt" />

          {/* LLM → STREAM: right(80,186) → left(168,186) */}
          <motion.path d="M 80 186 L 168 186" fill="none" stroke="#1A1714" strokeWidth="1" opacity="0.45" markerEnd="url(#arrowInk)" {...pathDraw(1.3)} />
          <EdgeLabel x={124} y={182} text="stream" />

          {/* Step numbers — tiny, subtle */}
          {(["01","02","03","04","05","06","07","08"] as const).map((n, i) => {
            const pos = [[8,10],[100,10],[192,10],[192,100],[100,100],[8,100],[8,168],[168,168]];
            return <text key={n} x={pos[i][0]+2} y={pos[i][1]+8} fontSize="5" fontFamily="monospace" fill="#1A1714" opacity="0.2">{n}</text>;
          })}
        </motion.svg>
      </div>
    </div>
  );
}

function InstantResponse() {
  type Msg = { id: number; role: "user" | "bot"; text: string };

  const pairs = [
    { q: "What's your return policy?",       a: "Full refunds within 30 days — no forms, no friction at all." },
    { q: "Can I train on my own data?",       a: "Upload PDFs, crawl any URL, or sync Notion in seconds." },
    { q: "Which frameworks do you support?",  a: "React, Next.js, or drop a script tag on any HTML page." },
    { q: "How fast is the response?",         a: "Sub-second. Cerebras inference averages ~1.2s end-to-end." },
  ];

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [phase, setPhase] = useState<"user"|"typing"|"streaming"|"pause">("pause");
  const [streamWords, setStreamWords] = useState(0);
  const [counter, setCounter] = useState(0);

  // Kick off first message
  useEffect(() => {
    const t = setTimeout(() => setPhase("user"), 600);
    return () => clearTimeout(t);
  }, []);

  // Phase machine
  useEffect(() => {
    if (phase === "user") {
      const pair = pairs[pairIdx];
      setMsgs(prev => [...prev.slice(-3), { id: counter, role: "user", text: pair.q }]);
      setCounter(c => c + 1);
      const t = setTimeout(() => setPhase("typing"), 1400);
      return () => clearTimeout(t);
    }
    if (phase === "typing") {
      const t = setTimeout(() => { setStreamWords(0); setPhase("streaming"); }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, pairIdx]);

  // Word streaming
  useEffect(() => {
    if (phase !== "streaming") return;
    const words = pairs[pairIdx].a.split(" ");
    let w = 0;
    const iv = setInterval(() => {
      w++;
      setStreamWords(w);
      if (w >= words.length) {
        clearInterval(iv);
        const done = { id: counter, role: "bot" as const, text: pairs[pairIdx].a };
        setMsgs(prev => [...prev.slice(-3), done]);
        setCounter(c => c + 1);
        setPhase("pause");
        const t = setTimeout(() => {
          setPairIdx(p => (p + 1) % pairs.length);
          setPhase("user");
        }, 3800);
        return () => clearTimeout(t);
      }
    }, 65);
    return () => clearInterval(iv);
  }, [phase]);

  const currentWords = pairs[pairIdx].a.split(" ").slice(0, streamWords).join(" ");

  return (
    <div className="w-full h-full flex flex-col p-6 gap-3">
      {/* Header */}
      <div>
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl font-black text-[#1A1714] mb-1">Instant Response</h3>
        <p className="text-xs text-[#8C7B68]">Sub-second replies, powered by Cerebras inference.</p>
      </div>

      {/* Metric strip */}
      <div className="flex items-center gap-3 bg-white border border-[#E2D9CC] rounded-xl px-4 py-2 shadow-sm flex-shrink-0">
        <motion.div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        />
        <span className="text-[11px] font-black text-[#1A1714]">~1.2s</span>
        <span className="text-[9px] text-[#8C7B68] font-bold uppercase tracking-widest">avg latency</span>
        <div className="h-4 w-px bg-[#E2D9CC] mx-1" />
        <span className="text-[11px] font-black text-[#EAB564]">2.1k</span>
        <span className="text-[9px] text-[#8C7B68] font-bold uppercase tracking-widest">tok/s</span>
        <div className="ml-auto flex items-end gap-[2px] h-5">
          {[3,5,4,7,5,8,6,9,7,8].map((h, i) => (
            <motion.div key={i} className="w-[3px] rounded-full bg-[#EAB564]/60"
              style={{ height: h * 2 }}
              animate={{ height: [h * 2, (h + 2) * 2, h * 2] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>

      {/* Premium gradient-border chat container */}
      <div
        className="flex-1 rounded-2xl overflow-hidden relative min-h-0"
        style={{
          background: "linear-gradient(#F7F4EF, #F7F4EF) padding-box, linear-gradient(to bottom, #EAB564 0%, rgba(234,181,100,0.15) 65%, transparent 100%) border-box",
          border: "1.5px solid transparent",
        }}
      >
        {/* Inner chat scroll area */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-4 pt-3 gap-3 overflow-hidden">

          {/* Completed messages */}
          <AnimatePresence initial={false}>
            {msgs.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className={`flex ${ msg.role === "user" ? "justify-end" : "items-end gap-2" }`}
              >
                {msg.role === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EAB564]/30 to-[#EAB564]/10 border border-[#EAB564]/40 flex items-center justify-center flex-shrink-0 text-[10px] mb-0.5">✦</div>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl text-[12px] leading-snug max-w-[82%] ${
                    msg.role === "user"
                      ? "bg-[#1A1714] text-[#F7F4EF] rounded-br-[4px] shadow-md"
                      : "bg-white border border-[#E2D9CC] text-[#1A1714] rounded-bl-[4px] shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {phase === "typing" && (
              <motion.div
                className="flex items-end gap-2"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EAB564]/30 to-[#EAB564]/10 border border-[#EAB564]/40 flex items-center justify-center text-[10px]">✦</div>
                <div className="bg-white border border-[#E2D9CC] px-4 py-2.5 rounded-2xl rounded-bl-[4px] shadow-sm">
                  <div className="flex gap-1 items-center h-3.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#8C7B68]/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.65, delay: i * 0.12, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streaming bot response */}
          <AnimatePresence>
            {phase === "streaming" && (
              <motion.div
                className="flex items-end gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EAB564]/30 to-[#EAB564]/10 border border-[#EAB564]/40 flex items-center justify-center text-[10px] flex-shrink-0 mb-0.5">✦</div>
                <div className="bg-white border border-[#E2D9CC] px-3.5 py-2 rounded-2xl rounded-bl-[4px] text-[12px] leading-snug text-[#1A1714] max-w-[82%] shadow-sm">
                  {currentWords}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="inline-block w-[5px] h-[11px] bg-[#EAB564] align-middle ml-0.5 rounded-[1px]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top fade — anchors the gradient dissolve visually */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#F7F4EF] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}


function TelemetricGlobe() {
  const stats = [
    { label: "Edge Nodes", value: "280+", live: true },
    { label: "SSL / TLS", value: "SECURE", live: false },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FFFFFF] p-8 group">
      {/* Background Grid Pattern — Enhanced visibility */}
      <div className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(26,23,20,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,23,20,0.06) 1px, transparent 1px)`, 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* Text */}
      <div className="relative z-20">
        <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-black text-[#1A1714] mb-1">Global Reach</h3>
        <p className="text-xs text-[#8C7B68] leading-relaxed">Serving queries worldwide on the edge.</p>
      </div>

      {/* Live stat pills */}
      <div className="relative z-20 flex gap-2 mt-5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2 bg-white border border-[#E2D9CC] rounded-xl px-3 py-1.5 shadow-sm">
            {s.live && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            )}
            <span className="text-[11px] font-black text-[#EAB564]">{s.value}</span>
            <span className="text-[9px] text-[#8C7B68] font-bold uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Gold atmospheric glow behind globe — refined for light theme */}
      <div
        className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full pointer-events-none z-10"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(234,181,100,0.12) 0%, rgba(234,181,100,0.04) 45%, transparent 72%)",
        }}
      />

      {/* Real WorldGlobe — bottom right */}
      <div className="absolute -bottom-10 -right-10 w-[320px] h-[320px] z-10 opacity-90 group-hover:opacity-100 transition-opacity duration-700">
        <WorldGlobe
          isLive={true}
          markers={[
            { location: [37.77, -122.42], size: 6, label: "San Francisco" },
            { location: [51.50, -0.12],   size: 5, label: "London" },
            { location: [35.68, 139.69],  size: 5, label: "Tokyo" },
            { location: [1.35, 103.82],   size: 4, label: "Singapore" },
          ]}
        />
      </div>
    </div>
  );
}


// --- MAIN BENTO GRID ---

export function BentoFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[440px] gap-6">
      {/* 01: Integration Orbit (65% width) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="md:col-span-8 rounded-[3rem] bg-[#FFFFFF] border border-[#E2D9CC] overflow-hidden flex flex-col relative group"
      >
        <div className="p-10 relative z-30 pointer-events-none">
          <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-3xl font-black text-[#1A1714] mb-3">Deploy Anywhere</h3>
          <p className="text-lg text-[#8C7B68] max-w-md">React, Next.js, or plain HTML. One embed, every platform — no re-engineering required.</p>
        </div>
        <div className="flex-1">
          <DeploymentTerminal />
        </div>
      </motion.div>

      {/* 02: Knowledge Stack (35% width) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="md:col-span-4 rounded-[3rem] bg-[#F7F4EF] border border-[#E2D9CC] overflow-hidden flex flex-col"
      >
        <div className="p-10 pb-0">
          <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-2xl font-black text-[#1A1714] mb-2">Multi-Source Retrieval</h3>
          <p className="text-base text-[#8C7B68]">Siphon intelligence from PDFs, sitemaps, and cloud documents.</p>
        </div>
        <div className="flex-1">
          <SwipeableDeck />
        </div>
      </motion.div>

      {/* 03: Context Spotlight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="md:col-span-4 rounded-[3rem] bg-[#FFFFFF] border border-[#E2D9CC] overflow-hidden"
      >
        <RAGBlueprint />
      </motion.div>

      {/* 04: Velocity Stream */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="md:col-span-4 rounded-[3rem] bg-[#F7F4EF] border border-[#E2D9CC] overflow-hidden"
      >
        <InstantResponse />
      </motion.div>

      {/* 05: Telemetric Globe */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="md:col-span-4 rounded-[3rem] bg-[#FFFFFF] border border-[#E2D9CC] overflow-hidden group"
      >
        <TelemetricGlobe />
      </motion.div>
    </div>
  );
}
