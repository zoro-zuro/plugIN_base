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
  | "flutter"
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
    switch (framework) {
      case "html":
        return `<!-- Add this code before closing </body> tag -->
<script>
  (function() {
    var embedUrl = '${embedUrl}';
    
    // DNS prefetch
    var link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = embedUrl;
    document.head.appendChild(link);

    // Chat Button
    var button = document.createElement('button');
    // SVG Icon
    var chatIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    
    button.innerHTML = chatIcon;
    button.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;background:linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);color:white;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.3);z-index:999999;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;padding:0;';
    
    button.onmouseover = function() { this.style.transform = 'scale(1.05) translateY(-2px)'; this.style.boxShadow = '0 6px 16px rgba(37,99,235,0.4)'; };
    button.onmouseout = function() { this.style.transform = 'scale(1) translateY(0)'; this.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'; };

    var iframe = null;
    var isOpen = false;

    button.onclick = function() {
      isOpen = !isOpen;
      
      if (isOpen && !iframe) {
        iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.style.cssText = 'position:fixed;bottom:96px;right:24px;width:400px;height:600px;max-height:80vh;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:999999;background:white;opacity:0;transition:opacity 0.3s ease;';
        document.body.appendChild(iframe);
        
        // Fade in
        requestAnimationFrame(() => iframe.style.opacity = '1');
      } 
      
      if (iframe) {
        iframe.style.display = isOpen ? 'block' : 'none';
        iframe.style.opacity = isOpen ? '1' : '0';
      }
      
      button.innerHTML = isOpen ? closeIcon : chatIcon;
      button.style.background = isOpen ? '#1f2937' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
    };

    document.body.appendChild(button);
  })();
</script>`;

      case "react":
        return `// npm install lucide-react (or use your own icons)
import { useEffect, useState } from 'react';

// Simple SVG Icons inline for portability
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = '${embedUrl}';

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = embedUrl;
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: isOpen ? '#1f2937' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)';
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <iframe
          src={embedUrl}
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '400px',
            height: '600px',
            maxHeight: '80vh',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 999999,
            background: 'white',
          }}
          title="Chatbot"
        />
      )}
    </>
  );
}`;

      case "nextjs":
        return `// components/ChatbotWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react'; // Make sure to install lucide-react

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = '${embedUrl}';

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = embedUrl;
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full border-none text-white cursor-pointer shadow-lg shadow-blue-600/30 z-50 transition-all hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600"
        style={{
          background: isOpen ? '#1f2937' : undefined // Dark grey when open
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <iframe
          src={embedUrl}
          className="fixed bottom-24 right-6 w-[400px] h-[600px] max-h-[80vh] border-none rounded-2xl shadow-2xl z-50 bg-white"
          title="Chatbot"
        />
      )}
    </>
  );
}`;

      default:
        return "// Select a framework to see the code";
    }
  };

  const frameworks = [
    { id: "html" as Framework, name: "HTML/JS", icon: <FiGlobe /> },
    { id: "react" as Framework, name: "React", icon: <FiBox /> },
    { id: "nextjs" as Framework, name: "Next.js", icon: <Zap size={16} /> },
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
          {/* 1. Quick Test */}
          <section className="bg-gradient-to-br from-primary/5 to-fuchsia-500/5 border border-primary/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground mb-2">
                Ready to launch?
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your agent is live at a unique URL. Test it in a full-screen
                window before embedding it.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-mono bg-background/50 p-2 rounded-lg border border-border w-fit">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[250px]">{embedUrl}</span>
              </div>
            </div>
            <button
              onClick={handleTestNow}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2 shrink-0"
            >
              <FiExternalLink /> Open Live Demo
            </button>
          </section>

          {/* 2. Framework Selector */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                1
              </span>
              Choose Platform
            </h2>
            <div className="flex flex-wrap gap-3">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border ${
                    selectedFramework === fw.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {fw.icon}
                  {fw.name}
                </button>
              ))}
            </div>
          </section>

          {/* 3. Embed Code */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  2
                </span>
                Copy Code
              </h2>
              <button
                onClick={handleCopy}
                className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? "Copied!" : "Copy Snippet"}
              </button>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl -m-1 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-all duration-500 blur-sm" />
              <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <div className="ml-auto text-xs text-muted-foreground font-mono opacity-50">
                    read-only
                  </div>
                </div>
                <div className="overflow-x-auto p-0">
                  <pre className="p-6 text-sm font-mono leading-relaxed bg-[#0d1117] text-gray-300">
                    <code>{getEmbedCode(selectedFramework)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Visual Preview */}
          <section className="pb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                3
              </span>
              Preview
            </h2>
            <div className="relative h-[300px] w-full bg-muted/20 border border-dashed border-border rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                <p className="text-sm font-medium text-muted-foreground bg-background/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                  Widget will appear in bottom-right corner
                </p>
              </div>

              {/* Fake Widget */}
              <div className="absolute bottom-6 right-6 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-white text-2xl shadow-xl shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  💬
                </div>
                <div className="absolute bottom-full right-0 mb-3 w-64 bg-card border border-border rounded-2xl p-4 shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap size={14} className="text-primary fill-current" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {chatbot.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg text-xs text-muted-foreground">
                    Hello! How can I help you?
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
