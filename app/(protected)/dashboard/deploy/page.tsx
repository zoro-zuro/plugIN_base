"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function DeployPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("http://localhost:3000/embed");

  useEffect(() => {
    setEmbedUrl(`${window.location.origin}/embed`);
  }, []);

  const embedCode = `<!-- Add this code before closing </body> tag -->
<script>
  (function() {
    // Create chat button
    var button = document.createElement('button');
    button.innerHTML = '💬';
    button.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:white;font-size:28px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999999;transition:transform 0.2s;';
    button.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
    button.onmouseout = function() { this.style.transform = 'scale(1)'; };

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.style.cssText = 'position:fixed;bottom:90px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,0.2);z-index:999999;display:none;';

    // Toggle chat
    var isOpen = false;
    button.onclick = function() {
      isOpen = !isOpen;
      iframe.style.display = isOpen ? 'block' : 'none';
      button.innerHTML = isOpen ? '✕' : '💬';
      button.style.background = isOpen ? '#ef4444' : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)';
    };

    // Add to page
    document.body.appendChild(button);
    document.body.appendChild(iframe);
  })();
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestNow = () => {
    window.open(embedUrl, "_blank");
  };

  return (
    <div className="min-h-screen  from-indigo-50 via-purple-50 to-pink-50   py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Deploy Your Chatbot 🚀
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Copy and paste this code into your website to add the chatbot
            </p>
          </div>

          {/* Test Button */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={handleTestNow}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all"
            >
              🎯 Test Chatbot Now
            </button>
            <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
              <p className="text-sm text-indigo-900 dark:text-indigo-200">
                <strong>✅ Your chatbot is ready!</strong> Test it first, then
                embed on any website.
              </p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Preview
            </h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 relative h-[400px]">
              <p className="text-gray-600 dark:text-gray-400 text-center text-lg">
                Your chatbot will appear as a floating button in the
                bottom-right corner 👇
              </p>
              <div className="absolute bottom-6 right-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl shadow-2xl cursor-pointer hover:scale-110 transition-transform animate-pulse">
                  💬
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Embed Code
              </h2>
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
              >
                {copied ? "✓ Copied!" : "📋 Copy Code"}
              </button>
            </div>
            <pre className="bg-gray-900 dark:bg-black text-emerald-400 dark:text-emerald-300 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed shadow-lg border border-gray-700 dark:border-gray-600">
              <code>{embedCode}</code>
            </pre>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 text-lg flex items-center gap-2">
              📝 Installation Instructions
            </h3>
            <ol className="space-y-3 text-indigo-900 dark:text-indigo-200">
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  1.
                </span>
                <span>Click "Copy Code" button above</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  2.
                </span>
                <span>Open your website's HTML file (or page editor)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  3.
                </span>
                <span>
                  Paste the code before the closing{" "}
                  <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-mono text-sm">
                    &lt;/body&gt;
                  </code>{" "}
                  tag
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  4.
                </span>
                <span>Save and refresh your website</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  5.
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  ✨ Done! The chat button will appear on your site
                </span>
              </li>
            </ol>
          </div>

          {/* Stats */}
          {user && (
            <div className="mt-8 p-6 bg-slate-50 dark:bg-gray-700 rounded-xl border-2 border-slate-200 dark:border-gray-600 shadow-sm">
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 text-lg">
                Chatbot Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Owner
                  </p>
                  <p className="font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-slate-200 dark:border-gray-600">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Namespace
                  </p>
                  <p className="font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-slate-200 dark:border-gray-600">
                    {user.id}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Direct Link
                  </p>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline break-all bg-white dark:bg-gray-800 px-3 py-2 rounded border border-slate-200 dark:border-gray-600 block"
                  >
                    {embedUrl}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
