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
    switch (framework) {
      case "html":
        return `<!-- Add this code before closing </body> tag -->
<script>
  (function () {
    var embedUrl = '${embedUrl}';

    // DNS prefetch
    var link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = embedUrl;
    document.head.appendChild(link);

    // Sparkle star icons
    var starIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">' +
      '<path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z"/>' +
      '<circle cx="50" cy="16" r="2" fill="currentColor" />' +
      '<circle cx="18" cy="46" r="1.6" fill="currentColor" />' +
      "</svg>";

    var starFilledIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#4f46e5"/>' +
      '<stop offset="50%" stop-color="#ec4899"/>' +
      '<stop offset="100%" stop-color="#22d3ee"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<path fill="url(#sparkle-grad)" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z"/>' +
      '<circle cx="50" cy="16" r="2.4" fill="#22d3ee" />' +
      '<circle cx="18" cy="46" r="2" fill="#f97316" />' +
      "</svg>";

    // Halo
    var halo = document.createElement('div');
    halo.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "width:60px",
      "height:60px",
      "border-radius:999px",
      "background:radial-gradient(circle at 30% 0%, rgba(96,165,250,0.85), transparent 55%), radial-gradient(circle at 70% 100%, rgba(244,114,182,0.85), transparent 55%)",
      "opacity:0.5",
      "filter:blur(10px)",
      "pointer-events:none",
      "z-index:999998",
      "transition:opacity 0.2s ease, transform 0.2s ease"
    ].join(";");
    document.body.appendChild(halo);

    // Button
    var button = document.createElement('button');
    button.type = "button";
    button.innerHTML = starIcon;
    button.style.cssText = [
      "position:fixed",
      "bottom:22px",
      "right:22px",
      "width:54px",
      "height:54px",
      "border-radius:999px",
      "border:1px solid rgba(148,163,184,0.35)",
      "background:rgba(15,23,42,0.88)",
      "backdrop-filter:blur(14px)",
      "-webkit-backdrop-filter:blur(14px)",
      "color:#e5e7eb",
      "cursor:pointer",
      "box-shadow:0 18px 40px rgba(15,23,42,0.45)",
      "z-index:999999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:0",
      "transition:transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease",
      "outline:none"
    ].join(";");
    document.body.appendChild(button);

    button.onmouseover = function () {
      button.style.transform = "translateY(-2px) scale(1.04)";
      button.style.boxShadow = "0 22px 55px rgba(15,23,42,0.6)";
      halo.style.opacity = "0.8";
      halo.style.transform = "scale(1.05)";
    };
    button.onmouseout = function () {
      button.style.transform = "translateY(0) scale(1)";
      button.style.boxShadow = "0 18px 40px rgba(15,23,42,0.45)";
      halo.style.opacity = "0.5";
      halo.style.transform = "scale(1)";
    };

    // Preloaded iframe
    var iframe = document.createElement('iframe');
    iframe.src = "";
    iframe.style.cssText = [
      "position:fixed",
      "bottom:96px",
      "right:24px",
      "width:400px",
      "height:600px",
      "max-height:80vh",
      "border:none",
      "border-radius:18px",
      "box-shadow:0 22px 60px rgba(15,23,42,0.55)",
      "z-index:999999",
      "background:#020617",
      "opacity:0",
      "display:none",
      "transition:opacity 0.25s ease"
    ].join(";");
    document.body.appendChild(iframe);

    var isOpen = false;

    // Preload after load
    window.addEventListener("load", function () {
      setTimeout(function () {
<<<<<<< HEAD
          if (!iframe.src || iframe.src === "about:blank") {
             iframe.src = embedUrl;
        }
=======
        iframe.src = embedUrl;
>>>>>>> 64758ac44de7ceb6a32cd469e2588b2be79ac89c
      }, 500);
    });

    button.onclick = function () {
      isOpen = !isOpen;
      
      if (isOpen) {
      if (!iframe.src || iframe.src === "about:blank") {
             iframe.src = embedUrl;
        }
        
        iframe.style.display = "block";
        requestAnimationFrame(function () {
          iframe.style.opacity = "1";
        });
        button.innerHTML = starFilledIcon;
        button.style.background = "rgba(15,23,42,0.98)";
        button.style.borderColor = "rgba(129,140,248,0.9)";
      } else {
        iframe.style.opacity = "0";
        setTimeout(function () {
          if (!isOpen) iframe.style.display = "none";
        }, 250);
        button.innerHTML = starIcon;
        button.style.background = "rgba(15,23,42,0.88)";
        button.style.borderColor = "rgba(148,163,184,0.35)";
      }
    };
  })();
</script>
`;

      // React snippet in getEmbedCode("react")
      case "react":
        return `import { useEffect, useRef, useState } from "react";

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" />
    <circle cx="50" cy="16" r="2" fill="currentColor" />
    <circle cx="18" cy="46" r="1.6" fill="currentColor" />
  </svg>
);

const StarFilledIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
    <defs>
      <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <path fill="url(#sparkle-grad)" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" />
    <circle cx="50" cy="16" r="2.4" fill="#22d3ee" />
    <circle cx="18" cy="46" r="2" fill="#f97316" />
  </svg>
);

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef(null);
  const embedUrl = '${embedUrl}';

  // dns-prefetch
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = embedUrl;
    document.head.appendChild(link);
  }, []);

  // preload iframe src after load
  useEffect(() => {
    const onLoad = () => {
      setTimeout(() => {
        if (iframeRef.current && !iframeRef.current.src) {
          iframeRef.current.src = embedUrl;
        }
      }, 1500);
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <>
      {/* halo */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 30% 0%, rgba(96,165,250,0.85), transparent 55%), radial-gradient(circle at 70% 100%, rgba(244,114,182,0.85), transparent 55%)",
          opacity: 0.5,
          filter: "blur(10px)",
          pointerEvents: "none",
          zIndex: 999998,
          transition: "opacity 0.2s ease, transform 0.2s ease",
          transform: isOpen ? "scale(1.05)" : "scale(1)",
        }}
      />

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          width: 54,
          height: 54,
          borderRadius: 999,
          border: "1px solid " + (isOpen ? "rgba(129,140,248,0.9)" : "rgba(148,163,184,0.35)"),
          background: isOpen ? "rgba(15,23,42,0.98)" : "rgba(15,23,42,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "#e5e7eb",
          cursor: "pointer",
          boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition:
            "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
          e.currentTarget.style.boxShadow = "0 22px 55px rgba(15,23,42,0.6)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 18px 40px rgba(15,23,42,0.45)";
        }}
      >
        {isOpen ? <StarFilledIcon /> : <StarIcon />}
      </button>

      <iframe
        ref={iframeRef}
        title="Chatbot"
        style={{
          position: "fixed",
          bottom: 96,
          right: 24,
          width: 400,
          height: 600,
          maxHeight: "80vh",
          border: "none",
          borderRadius: 18,
          boxShadow: "0 22px 60px rgba(15,23,42,0.55)",
          zIndex: 999999,
          background: "#020617",
          opacity: isOpen ? 1 : 0,
          display: isOpen ? "block" : "none",
          transition: "opacity 0.25s ease",
        }}
      />
    </>
  );
}
`;

      case "nextjs":
        return `// components/ChatbotWidget.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" />
    <circle cx="50" cy="16" r="2" fill="currentColor" />
    <circle cx="18" cy="46" r="1.6" fill="currentColor" />
  </svg>
);

const StarFilledIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
    <defs>
      <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <path fill="url(#sparkle-grad)" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" />
    <circle cx="50" cy="16" r="2.4" fill="#22d3ee" />
    <circle cx="18" cy="46" r="2" fill="#f97316" />
  </svg>
);

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const embedUrl = '${embedUrl}';

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = embedUrl;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const onLoad = () => {
      setTimeout(() => {
        if (iframeRef.current && !iframeRef.current.src) {
          iframeRef.current.src = embedUrl;
        }
      }, 1500);
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-[20px] right-[20px] z-[9998] rounded-full"
        style={{
          width: 60,
          height: 60,
          background:
            "radial-gradient(circle at 30% 0%, rgba(96,165,250,0.85), transparent 55%), radial-gradient(circle at 70% 100%, rgba(244,114,182,0.85), transparent 55%)",
          opacity: 0.5,
          filter: "blur(10px)",
          transform: isOpen ? "scale(1.05)" : "scale(1)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      />

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-[22px] right-[22px] z-[9999] flex h-[54px] w-[54px] items-center justify-center rounded-full text-slate-100"
        style={{
          border: "1px solid " + (isOpen ? "rgba(129,140,248,0.9)" : "rgba(148,163,184,0.35)"),
          background: isOpen ? "rgba(15,23,42,0.98)" : "rgba(15,23,42,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
          transition:
            "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
          e.currentTarget.style.boxShadow = "0 22px 55px rgba(15,23,42,0.6)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 18px 40px rgba(15,23,42,0.45)";
        }}
      >
        {isOpen ? <StarFilledIcon /> : <StarIcon />}
      </button>

      <iframe
        ref={iframeRef}
        title="Chatbot"
        className="fixed bottom-24 right-6"
        style={{
          width: 400,
          height: 600,
          maxHeight: "80vh",
          border: "none",
          borderRadius: 18,
          boxShadow: "0 22px 60px rgba(15,23,42,0.55)",
          zIndex: 999999,
          background: "#020617",
          opacity: isOpen ? 1 : 0,
          display: isOpen ? "block" : "none",
          transition: "opacity 0.25s ease",
        }}
      />
    </>
  );
}
`;

      case "php":
        return `<!-- In a PHP / Blade template -->
<?php $embedUrl = "${embedUrl}"; ?>

<script>
  (function () {
    var embedUrl = "<?php echo $embedUrl; ?>";

    var link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = embedUrl;
    document.head.appendChild(link);

    var button = document.createElement("button");
    button.type = "button";
    button.style.cssText =
      "position:fixed;bottom:22px;right:22px;width:54px;height:54px;border-radius:999px;border:1px solid rgba(148,163,184,0.35);background:rgba(15,23,42,0.9);color:#e5e7eb;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:999999;";
    button.innerHTML = "✦";
    document.body.appendChild(button);

    var iframe = document.createElement("iframe");
    iframe.src = "";
    iframe.style.cssText =
      "position:fixed;bottom:96px;right:24px;width:400px;height:600px;max-height:80vh;border:none;border-radius:18px;box-shadow:0 22px 60px rgba(15,23,42,0.55);background:#020617;opacity:0;display:none;transition:opacity 0.25s ease;z-index:999999;";
    document.body.appendChild(iframe);

    var isOpen = false;

    window.addEventListener("load", function () {
      setTimeout(function () {
        iframe.src = embedUrl;
      }, 1500);
    });

    button.onclick = function () {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.style.display = "block";
        requestAnimationFrame(function () {
          iframe.style.opacity = "1";
        });
      } else {
        iframe.style.opacity = "0";
        setTimeout(function () {
          if (!isOpen) iframe.style.display = "none";
        }, 250);
      }
    };
  })();
</script>`;

      case "angular":
        return `// app-chatbot-widget.component.ts
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";

@Component({
  selector: "app-chatbot-widget",
  template: \`
    <button type="button" (click)="toggle()" class="chat-launcher">
      <span [innerHTML]="isOpen ? starFilledIcon : starIcon"></span>
    </button>
    <iframe #frame title="Chatbot" class="chat-frame" [class.chat-frame--open]="isOpen"></iframe>
  \`,
  styles: [\`
    .chat-launcher {
      position: fixed;
      bottom: 22px;
      right: 22px;
      width: 54px;
      height: 54px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.35);
      background: rgba(15,23,42,0.9);
      color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 18px 40px rgba(15,23,42,0.45);
      z-index: 999999;
    }
    .chat-frame {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 400px;
      height: 600px;
      max-height: 80vh;
      border: none;
      border-radius: 18px;
      box-shadow: 0 22px 60px rgba(15,23,42,0.55);
      background: #020617;
      opacity: 0;
      display: none;
      transition: opacity 0.25s ease;
      z-index: 999999;
    }
    .chat-frame.chat-frame--open {
      opacity: 1;
      display: block;
    }
  \`],
})
export class ChatbotWidgetComponent implements OnInit {
  @ViewChild("frame") frameRef!: ElementRef<HTMLIFrameElement>;
  isOpen = false;
  embedUrl = "${embedUrl}";

  starIcon = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="34" height="34"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" /><circle cx="50" cy="16" r="2" fill="currentColor" /><circle cx="18" cy="46" r="1.6" fill="currentColor" /></svg>\`;
  starFilledIcon = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36"><defs><linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="50%" stop-color="#ec4899"/><stop offset="100%" stop-color="#22d3ee"/></linearGradient></defs><path fill="url(#sparkle-grad)" d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z" /><circle cx="50" cy="16" r="2.4" fill="#22d3ee" /><circle cx="18" cy="46" r="2" fill="#f97316" /></svg>\`;

  ngOnInit() {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = this.embedUrl;
    document.head.appendChild(link);

    window.addEventListener("load", () => {
      setTimeout(() => {
        if (this.frameRef?.nativeElement && !this.frameRef.nativeElement.src) {
          this.frameRef.nativeElement.src = this.embedUrl;
        }
      }, 1500);
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}`;

      default:
        return "// Select a framework to see the code";
    }
  };

  const frameworks = [
    { id: "html" as Framework, name: "HTML/JS", icon: <FiGlobe /> },
    { id: "react" as Framework, name: "React", icon: <FiBox /> },
    { id: "nextjs" as Framework, name: "Next.js", icon: <Zap size={16} /> },
    { id: "angular" as Framework, name: "Angular", icon: <FiBox /> },
    { id: "php" as Framework, name: "PHP", icon: <FiBox /> },
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
                Your chatbot is live at a unique URL. Test it in a full-screen
                window before embedding it.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-mono bg-background/50 p-2 rounded-lg border border-border w-fit">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[250px]">
                  {embedUrl.slice(0, 35)}...
                </span>
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
          {/* ✅ UNIFIED SECTION: Frameworks + Embed Code */}
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
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl -m-1 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-all duration-500 blur-sm" />

              <div className="relative bg-[#0d1117] border border-border rounded-xl overflow-hidden shadow-2xl">
                {/* ✅ MERGED HEADER: Frameworks (Left) + Copy (Right) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-muted/10 border-b border-white/10 backdrop-blur-md">
                  {/* Framework Selector (Replaces Mac Dots) */}
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

                  {/* Copy Button (Replaces Read-only) */}
                  <button
                    onClick={handleCopy}
                    className="shrink-0 hidden  md:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors ml-auto"
                  >
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    {copied ? "Copied" : "Copy Code"}
                  </button>
                </div>

                {/* Warning */}
                <div className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500/30">
                  <p className="text-sm text-yellow-500">
                    ⚠️ Warning: Put the embed url under your .env file and load
                    it securely.
                  </p>
                </div>

                {/* ✅ CODE AREA: with Text Wrapping for Mobile */}
                <div className="p-0">
                  <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
                    <code>{getEmbedCode(selectedFramework)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Visual Preview */}
          <section className="pb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              Preview
            </h2>

            <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              {/* hint text */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                <p className="rounded-lg bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                  Widget will appear in the bottom-right corner
                </p>
              </div>

              {/* Fake widget launcher + bubble */}
              <div className="absolute bottom-6 right-6">
                {/* halo */}
                <div className="pointer-events-none absolute inset-[-4px] rounded-full bg-[radial-gradient(circle_at_30%_0%,rgba(148,163,184,0.6),transparent_55%),radial-gradient(circle_at_70%_100%,rgba(30,64,175,0.7),transparent_55%)] opacity-60 blur-md" />

                <div className="group relative cursor-pointer">
                  {/* launcher */}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-500/40 bg-slate-900/90 text-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.85)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                    {/* same star icon visual as launcher (simplified) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 64 64"
                      width="34"
                      height="34"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="preview-star-grad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M32 6l4.6 11.7L48 22.6 36.8 26 32 38l-4.8-12L16 22.6l11.4-4.9L32 6z"
                        fill="url(#preview-star-grad)"
                      />
                      <circle cx="50" cy="16" r="2.2" fill="#38bdf8" />
                      <circle cx="18" cy="46" r="1.8" fill="#e5e7eb" />
                    </svg>
                  </div>

                  {/* hover bubble */}
                  <div className="pointer-events-none absolute bottom-full right-0 mb-3 w-64 translate-y-2 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 text-xs text-slate-100 opacity-0 shadow-xl shadow-black/60 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="mb-2 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800">
                        <Zap size={14} className="text-slate-100" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-50">
                          {chatbot.name}
                        </div>
                        <div className="text-[10px] text-slate-400">Online</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 px-2.5 py-2 text-[11px] text-slate-200">
                      Hello! How can I help you?
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
