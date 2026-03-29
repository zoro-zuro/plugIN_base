"use client";

import { useState } from "react";
import { FiGlobe, FiPlus, FiLoader, FiCheckCircle } from "react-icons/fi";
import { crawlAndTrainUrl } from "@/app/actions/crawler";
import toast from "react-hot-toast";

export default function CrawlUrlCard({ 
  namespace, 
  onSuccess 
}: { 
  namespace: string;
  onSuccess?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCrawl = async () => {
    if (!url) return toast.error("Please enter a URL");
    if (!url.startsWith("http")) return toast.error("URL must start with http:// or https://");

    setIsLoading(true);
    try {
      const res = await crawlAndTrainUrl(url, namespace, `Scraped from ${url}`);
      if (res.success) {
        toast.success("Website scraping started!");
        setUrl("");
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to crawl site");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card/40 border border-border rounded-xl p-4 md:p-6 shadow-sm overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
        <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
          <FiGlobe size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Import from Website</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Train your AI on any public URL (documentation, blog, FAQ).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/docs"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
            />
          </div>
          <button
            onClick={handleCrawl}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <FiLoader className="animate-spin" /> : <FiPlus />}
            {isLoading ? "Crawling..." : "Crawl"}
          </button>
        </div>
      </div>
    </div>
  );
}
