"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  UploadCloud,
  FileText,
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

// --- ANIMATION COMPONENTS ---
const UploadStep = () => (
  <motion.div
    key="upload-step"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-background to-muted/30"
  >
    <div className="w-24 h-24 rounded-3xl bg-primary/5 border-2 border-dashed border-primary/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
      <UploadCloud className="h-10 w-10 text-primary animate-bounce" />
    </div>
    <h3 className="text-2xl font-bold text-foreground mb-2">
      Upload your knowledge
    </h3>
    <p className="text-muted-foreground max-w-sm">
      Drag & drop PDFs, Docs, or connect your Notion & website sitemaps
      instantly.
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
    className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-background to-muted/30"
  >
    <div className="relative w-28 h-28 flex items-center justify-center mb-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        className="absolute inset-3 border-2 border-dashed border-fuchsia-500/20 rounded-full"
      />
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
        <Database className="h-8 w-8 text-primary" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-foreground mb-2">
      Training your AI Agent...
    </h3>
    <p className="text-muted-foreground max-w-sm mb-6">
      Chunking data, generating vectors, and optimizing for semantic search.
    </p>
    <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="h-full bg-gradient-to-r from-primary to-fuchsia-500"
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
    className="flex flex-col h-full bg-card/50"
  >
    {/* Chat Header */}
    <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
        <Bot size={20} />
      </div>
      <div>
        <p className="font-bold text-foreground">Custom Assistant</p>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-500">
            Online & Ready
          </span>
        </div>
      </div>
    </div>

    {/* Chat Area */}
    <div className="flex-1 p-6 space-y-6 overflow-hidden flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-4"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">U</span>
        </div>
        <div className="p-4 rounded-2xl rounded-tl-none bg-muted/80 text-sm text-foreground max-w-[80%]">
          What is the return policy for international orders?
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-4 flex-row-reverse"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
          <Bot size={14} className="text-primary" />
        </div>
        <div className="p-4 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-sm shadow-md shadow-primary/10 max-w-[85%]">
          International orders can be returned within 30 days of delivery.
          Original shipping costs are non-refundable, and return shipping fees
          apply.
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const [step, setStep] = useState(0);
  // Cycle order: Upload -> Process -> Chat
  const steps = ["upload", "processing", "ready"];

  useEffect(() => {
    const sequence = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 4500); // Change step every 4.5 seconds
    return () => clearInterval(sequence);
  }, [steps.length]);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] dark:bg-primary/20" />
        <div className="absolute top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-in backdrop-blur-sm hover:bg-primary/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Docs in. Chatbot out.</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-foreground sm:text-7xl mb-8 animate-slide-up leading-tight">
            Train a chatbot on your files <br className="hidden sm:block" />
            <span className="gradient-text">
              then plug it into your website.
            </span>
          </h1>

          <p
            className="mx-auto max-w-2xl text-lg text-muted-foreground mb-12 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Build custom AI agents trained on your data and plugin them into any
            website in seconds. No coding required.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/chatbot/create"
              className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
            >
              Build your Chatbot <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* HERO ANIMATED VISUAL */}
          <div
            className="relative mx-auto max-w-3xl animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-fuchsia-600 rounded-[2rem] blur opacity-20" />
            <div className="relative rounded-[1.75rem] border border-border bg-card/80 backdrop-blur-xl p-3 shadow-2xl">
              {/* Browser Header Fake */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-muted/50 rounded-t-[1.5rem] border-b border-border flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="mx-auto text-[10px] font-mono text-muted-foreground opacity-50">
                  pluginbase.ai/demo
                </div>
              </div>

              {/* Animation Container */}
              <div className="mt-12 aspect-[16/10] w-full bg-background rounded-xl overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {steps[step] === "upload" && <UploadStep />}
                  {steps[step] === "processing" && <ProcessingStep />}
                  {steps[step] === "ready" && <ReadyStep />}
                </AnimatePresence>
              </div>

              {/* Step Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      step === i
                        ? "w-8 bg-primary"
                        : "w-1.5 bg-primary/20 hover:bg-primary/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Gifo Style Flow) */}
      <section
        id="how-it-works"
        className="py-24 border-y border-border bg-secondary/30 relative"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Zap className="h-4 w-4" /> Process
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We simplify the complex process of RAG (Retrieval Augmented
              Generation) into three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent border-t border-dashed border-primary/30 z-0"></div>

            {[
              {
                step: "01",
                icon: <Upload className="h-6 w-6" />,
                title: "Connect Data",
                desc: "Upload PDFs, sitemaps, or text files. We automatically process and chunk your data.",
              },
              {
                step: "02",
                icon: <Code className="h-6 w-6" />,
                title: "Customize & Embed",
                desc: "Style your widget to match your brand. Copy one line of code to your site.",
              },
              {
                step: "03",
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Analyze & Improve",
                desc: "View chat logs, identify knowledge gaps, and update your bot in real-time.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-3xl bg-card border border-border shadow-lg flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
              Everything you need to build <br />
              <span className="gradient-text">powerful AI agents</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Database className="h-6 w-6 text-violet-500" />,
                title: "Hybrid Search",
                desc: "Combines vector semantic search with keyword search for maximum accuracy.",
              },
              {
                icon: <Globe className="h-6 w-6 text-blue-500" />,
                title: "Multi-Source",
                desc: "Train on websites, Notion pages, Google Docs, and raw text simultaneously.",
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-emerald-500" />,
                title: "Deep Analytics",
                desc: "Understand what your users are asking and improve your knowledge base.",
              },
              {
                icon: <Shield className="h-6 w-6 text-rose-500" />,
                title: "Secure & Private",
                desc: "Your data is encrypted at rest and in transit. We prioritize your privacy.",
              },
              {
                icon: <Zap className="h-6 w-6 text-amber-500" />,
                title: "Streaming API",
                desc: "Fast, token-by-token streaming responses just like ChatGPT.",
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-pink-500" />,
                title: "Customizable UI",
                desc: "Match the chat widget to your brand colors and personality.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-20 text-center shadow-2xl sm:px-12">
            {/* CTA Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
              <div className="absolute top-0 -left-10 h-96 w-96 rounded-full bg-primary/40 blur-[100px]" />
              <div className="absolute bottom-0 -right-10 h-96 w-96 rounded-full bg-fuchsia-600/40 blur-[100px]" />
            </div>

            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-background sm:text-5xl mb-6">
                Ready to upgrade your website?
              </h2>
              <p className="mx-auto max-w-xl text-lg text-background/70 mb-10">
                Join thousands of developers building the future of
                conversational AI with PluginBase.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/chatbot/create"
                  className="rounded-full border bg-black/40 border-black/40 px-8 py-4 text-lg font-bold text-white hover:bg-black/50 transition-colors"
                >
                  Get started now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-white font-bold">
                P
              </div>
              <span className="font-bold text-foreground text-lg">
                PluginBase
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with ♥️ and lot of ☕️ {""}
              <span>
                <Link
                  href="https://sheik-portfolio-taupe.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  By{" "}
                  <span className="hover:text-primary transition-colors font-medium">
                    Shiek
                  </span>
                  .
                </Link>
              </span>
            </p>
          </div>

          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link
              href="https://github.com/zoro-zuro/plugIN_base.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
