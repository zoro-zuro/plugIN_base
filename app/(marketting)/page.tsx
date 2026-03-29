"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  UploadCloud,
  Bot,
  MessageSquare,
  Zap,
  Database,
  Code,
  Shield,
  BarChart3,
  Upload,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BentoFeatures } from "@/components/ui/BentoFeatures";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Logo } from "@/components/ui/Logo";

// --- ANIMATION COMPONENTS ---
const Counter = ({ value, suffix = "", prefix = "", startValue = 0, decimals = 0 }: { value: number, suffix?: string, prefix?: string, startValue?: number, decimals?: number }) => {
  const [display, setDisplay] = useState(startValue.toFixed(decimals));
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    function animate() {
      let startTime: number | null = null;
      const duration = 2000;
      
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (value - startValue) * ease;
        
        setDisplay(current.toFixed(decimals));
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          hasAnimated.current = true;
        }
      };
      
      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        animate();
      }
    }, { threshold: 0.5 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [value, startValue, decimals]);

  return <span ref={containerRef}>{prefix}{display}{suffix}</span>;
};

const FadeInWhenVisible = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const UploadStep = () => (
  <motion.div
    key="upload-step"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#F7F4EF]"
  >
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#EAB564]/10 border-2 border-dashed border-[#EAB564]/30 flex items-center justify-center mb-6 shadow-xl shadow-[#EAB564]/5">
      <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 text-[#EAB564] animate-bounce" />
    </div>
    <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-xl sm:text-2xl font-black text-[#1A1714] mb-2">
      Upload your knowledge
    </h3>
    <p className="text-sm sm:text-base text-[#5C5448] max-w-sm">
      Drag & drop PDFs, Docs, or connect your website sitemaps instantly.
    </p>
  </motion.div>
);

const ProcessingStep = () => (
  <motion.div
    key="processing-step"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#F7F4EF]"
  >
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute inset-0 border-4 border-dashed border-[#EAB564]/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        className="absolute inset-3 border-2 border-dashed border-amber-500/10 rounded-full"
      />
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#EAB564]/10 flex items-center justify-center shadow-inner">
        <Database className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4924A]" />
      </div>
    </div>
    <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-xl sm:text-2xl font-black text-[#1A1714] mb-2">
      Training your AI Chatbot...
    </h3>
    <p className="text-sm sm:text-base text-[#5C5448] max-w-sm mb-6">
      Chunking data, generating vectors, and optimizing for semantic search.
    </p>
    <div className="w-48 sm:w-64 h-2 bg-[#E2D9CC] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="h-full bg-gradient-to-r from-[#EAB564] to-[#C87A38]"
      />
    </div>
  </motion.div>
);

const ReadyStep = () => (
  <motion.div
    key="ready-step"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col h-full bg-[#FFFFFF]"
  >
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E2D9CC] bg-[#F7F4EF]/80 backdrop-blur flex items-center gap-3 sm:gap-4">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1A1714] flex items-center justify-center text-[#EAB564] shadow-lg shadow-[#1A1714]/20">
        <Bot size={18} className="sm:w-5 sm:h-5" />
      </div>
      <div>
        <p className="text-sm sm:text-base font-bold text-[#1A1714]">
          Custom Assistant
        </p>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600">
            All Systems Active
          </span>
        </div>
      </div>
    </div>

    <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden flex flex-col justify-end bg-[#F7F4EF]/30">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 sm:gap-4"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E2D9CC] flex-shrink-0 flex items-center justify-center">
          <span className="text-[10px] sm:text-xs font-bold text-[#5C5448]">U</span>
        </div>
        <div className="p-3 sm:p-4 rounded-2xl rounded-tl-none bg-[#FFFFFF] border border-[#E2D9CC] text-xs sm:text-sm text-[#1A1714] max-w-[85%] shadow-sm">
          What is the return policy for international orders?
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-3 sm:gap-4 flex-row-reverse"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A1714] flex-shrink-0 flex items-center justify-center">
          <Bot size={14} className="text-[#EAB564] sm:w-4 sm:h-4" />
        </div>
        <div className="p-3 sm:p-4 rounded-2xl rounded-tr-none bg-[#1A1714] text-[#F7F4EF] text-xs sm:text-sm shadow-xl shadow-[#1A1714]/20 max-w-[90%]">
          International orders can be returned within 30 days. Original shipping
          costs are non-refundable.
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const [step, setStep] = useState(0);
  const steps = ["upload", "processing", "ready"];

  useEffect(() => {
    const sequence = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(sequence);
  }, [steps.length]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF] text-[#1A1714]">
      {/* 01 — HERO SECTION */}
      <section className="relative px-6 py-24 lg:py-32 overflow-hidden bg-[#F7F4EF]">
        <div className="absolute inset-0 z-0">
          <BackgroundRippleEffect rows={14} cellSize={56} />
        </div>

        <div className="absolute top-0 left-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#EAB564]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl pointer-events-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="text-left flex flex-col items-start pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB564] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB564]"></span>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7B4E]">
                  Docs in. Chatbot out.
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: 'Georgia, serif' }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1A1714] leading-[1.05] tracking-tight mb-8"
              >
                Train a chatbot <br /> on your files. <br />
                <span className="relative inline-block text-[#EAB564]">
                  Then plug it into your website.
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#EAB564]/40" viewBox="0 0 300 20" fill="none" preserveAspectRatio="none">
                    <path d="M5 15C50 5 150 5 295 15" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-lg sm:text-xl text-[#5C5448] mb-12 max-w-lg leading-relaxed font-normal"
              >
                Build custom AI chatbots trained on your documentation, PDFs, and website data. Plugin them into any website in seconds. No coding required.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link href="/chatbot/create">
                  <MagneticButton variant="primary">
                    Build your Chatbot
                  </MagneticButton>
                </Link>
                <Link href="#features">
                  <MagneticButton variant="ghost">
                    See how it works
                  </MagneticButton>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="relative hidden lg:block pointer-events-auto"
            >
              <div className="relative rounded-[2.5rem] border border-[#E2D9CC] bg-[#FFFFFF]/80 backdrop-blur-3xl p-3 shadow-[0_32px_80px_rgba(26,23,20,0.14)]">
                <div className="absolute top-0 left-0 right-0 h-14 bg-[#F7F4EF] rounded-t-[2.25rem] border-b border-[#E2D9CC] flex items-center px-6 gap-2">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E2D9CC]/50" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E2D9CC]/70" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#EAB564]" />
                  </div>
                  <div className="mx-auto text-[11px] font-mono text-[#8C7B68] font-bold opacity-70 tracking-tight">
                    pluginbase.ai/demo/widget
                  </div>
                </div>

                <div className="mt-14 aspect-[16/11] w-full bg-[#FFFFFF] rounded-2xl overflow-hidden relative border border-[#E2D9CC]/50">
                  <AnimatePresence mode="wait">
                    {steps[step] === "upload" && <UploadStep />}
                    {steps[step] === "processing" && <ProcessingStep />}
                    {steps[step] === "ready" && <ReadyStep />}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 02 — DARK METRICS SECTION (Reordered) */}
      <section className="py-20 bg-[#1A1714] border-y border-[#EAB564]/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-[#EAB564]/5 blur-[100px]" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Average Latency", component: <Counter value={1.2} startValue={8.5} decimals={1} prefix="< " suffix="s" /> },
              { label: "Global Edge Nodes", component: <Counter value={280} startValue={0} suffix="+" /> },
              { label: "Integration Effort", component: <Counter value={1} startValue={250} suffix=" Line" /> },
              { label: "Server Management", component: <Counter value={0} startValue={12} /> }
            ].map((stat, i) => (
              <FadeInWhenVisible key={stat.label} className="flex flex-col gap-2">
                <div style={{ fontFamily: 'Georgia, serif' }} className="text-4xl md:text-5xl font-black text-[#F7F4EF]">
                  {stat.component}
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#EAB564]">
                  {stat.label}
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — CAPABILITIES BENTO GRID (Stay Light) */}
      <section id="features" className="py-24 lg:py-28 bg-[#F7F4EF] border-b border-[#E2D9CC]/30">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            label="Capabilities"
            title="Everything you need to build powerful AI chatbots"
            centered
            theme="light"
          />

          <FadeInWhenVisible className="mt-24">
            <BentoFeatures />
          </FadeInWhenVisible>
        </div>
      </section>

      {/* 04 — PROCESS SECTION (Stay Dark) */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-[#1A1714] relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
            {/* Sticky Label/Title */}
            <div className="lg:sticky lg:top-32 lg:w-1/3 text-left">
              <SectionHeading
                label="Process"
                title="From your data to a live chatbot in minutes"
                description="Three simple steps to build, customize, and launch your custom AI chatbot."
                theme="dark"
              />
            </div>

            {/* Scroll-Reveal Steps Container */}
            <div className="lg:w-2/3 space-y-32 lg:space-y-48">
              {[
                {
                  step: "01",
                  icon: <Upload />,
                  title: "Feed your AI",
                  desc: "Upload PDFs, connect Notion docs, or sync your website. We'll automatically organize your data so your AI can find and deliver the right answers fast.",
                },
                {
                  step: "02",
                  icon: <Code />,
                  title: "Customize & Embed",
                  desc: "Design your chatbot to match your site's brand perfectly. When you're ready, copy and paste one script tag to add it to your website in seconds.",
                },
                {
                  step: "03",
                  icon: <BarChart3 />,
                  title: "Monitor & Refine",
                  desc: "Track conversations and see exactly what users are asking. Use real-time analytics to update your AI's knowledge and keep responses helpful.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 60, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, margin: "-20%" }}
                  transition={{
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative p-10 lg:p-14 rounded-[3rem] bg-[#1A1714] border border-[#EAB564]/10 shadow-2xl group overflow-hidden"
                >
                  {/* Decorative background number */}
                  <div style={{ fontFamily: 'Georgia, serif' }} className="absolute -top-10 -right-4 text-[12rem] font-black text-[#5C5448]/5 pointer-events-none select-none">
                    {item.step}
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#EAB564]/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700">
                      <div className="h-7 w-7 text-[#EAB564]">{item.icon}</div>
                    </div>

                    <h3 style={{ fontFamily: 'Georgia, serif' }} className="text-3xl lg:text-4xl font-black text-[#F7F4EF] mb-8">
                      {item.title}
                    </h3>
                    <p className="text-lg lg:text-xl text-[#8C7B68] leading-relaxed max-w-2xl">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 05 — CTA SECTION (Light card with gradient corners) */}
      <section className="py-24 lg:py-32 px-6 bg-[#F7F4EF]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl relative overflow-hidden rounded-[3rem] bg-[#FFFFFF] px-12 py-24 text-center shadow-2xl border border-[#E2D9CC]/50"
        >
          {/* Deep Ink Atmospheric Gradients */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#1A1714]/15 blur-[100px]" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#413B34]/15 blur-[100px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-full bg-[#EAB564]/5 blur-[80px]" />
          </div>

          {/* Premium Gold Inset Frame with Shine */}
          <div className="absolute inset-2 z-[5] rounded-[2.5rem] border-2 border-[#EAB564]/40 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#EAB564]/30 to-transparent skew-x-[-20deg]"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h2
              style={{ fontFamily: 'Georgia, serif' }}
              className="mx-auto max-w-3xl text-4xl sm:text-6xl font-black text-[#1A1714] leading-[1.1] mb-8"
            >
              The end of silent documentation. Build your chatbot today.
            </h2>
            <p className="mx-auto max-w-xl text-lg text-[#5C5448] mb-12">
              Transform your static data into a high-fidelity conversational engine. Join a new generation of builders engineering the next wave of RAG.
            </p>
            <Link href="/chatbot/create">
              <MagneticButton variant="primary">
                Get Started for Free
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 08 — FOOTER */}
      <footer className="bg-[#0A0908] pt-24 pb-12 border-t border-[#EAB564]/5">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10 opacity-80" />
              <span style={{ fontFamily: 'Georgia, serif' }} className="font-black text-2xl text-[#F7F4EF]">PluginBase</span>
            </div>
            <p className="text-sm text-[#8C7B68] max-w-xs leading-relaxed">
              Engineering high-fidelity RAG infrastructure for teams that value absolute precision and performance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-16 md:gap-24">
            <div className="flex flex-col gap-6 text-sm">
              <h4 className="text-[#F7F4EF] font-bold uppercase tracking-widest text-xs">Platform</h4>
              <div className="flex flex-col gap-4">
                <Link href="#features" className="text-[#8C7B68] hover:text-[#EAB564] transition-colors">Capabilities</Link>
                <Link href="#how-it-works" className="text-[#8C7B68] hover:text-[#EAB564] transition-colors">The Protocol</Link>
                <Link href="/chatbot/create" className="text-[#8C7B68] hover:text-[#EAB564] transition-colors">Create Chatbot</Link>
                <Link href="/chatbot/manage" className="text-[#8C7B68] hover:text-[#EAB564] transition-colors">Dashboard</Link>
              </div>
            </div>

            <div className="flex flex-col gap-6 text-sm">
              <h4 className="text-[#F7F4EF] font-bold uppercase tracking-widest text-xs">Social</h4>
              <div className="flex flex-col gap-4">
                <a 
                  href="https://github.com/zoro-zuro/plugIN_base" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#8C7B68] hover:text-[#EAB564] transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-24 pt-8 border-t border-[#EAB564]/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-[#5C5448]"> © 2026 PluginBase AI. All rights reserved. </p>
          <p className="text-xs text-[#5C5448]"> 
            Made with ♥️ by <a href="https://sheik-portfolio-taupe.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[#EAB564] transition-colors font-bold">Shiek</a>. 
          </p>
        </div>
      </footer>
    </div>
  );
}
