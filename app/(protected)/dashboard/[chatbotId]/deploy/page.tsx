"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiCheck, FiCopy } from "react-icons/fi";

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
    
    // DNS prefetch for faster loading
    var dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = embedUrl;
    document.head.appendChild(dnsPrefetch);

    // Create chat button
    var button = document.createElement('button');
    button.innerHTML = '💬';
    button.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:white;font-size:28px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999999;transition:transform 0.2s;';
    button.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
    button.onmouseout = function() { this.style.transform = 'scale(1)'; };

    var iframe = null;
    var isOpen = false;

    button.onclick = function() {
      isOpen = !isOpen;
      
      if (isOpen && !iframe) {
        iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.style.cssText = 'position:fixed;bottom:90px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,0.2);z-index:999999;';
        document.body.appendChild(iframe);
        
        button.innerHTML = '⏳';
        iframe.onload = function() {
          button.innerHTML = '✕';
        };
      } else if (iframe) {
        iframe.style.display = isOpen ? 'block' : 'none';
        button.innerHTML = isOpen ? '✕' : '💬';
      }
      
      button.style.background = isOpen ? '#ef4444' : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)';
    };

    document.body.appendChild(button);
  })();
</script>`;

      case "react":
        return `// Install in your React app
// npm install react

import { useEffect, useState } from 'react';

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = '${embedUrl}';

  useEffect(() => {
    // Preload iframe
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = embedUrl;
    document.head.appendChild(link);
  }, []);

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: isOpen 
            ? '#ef4444' 
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 999999,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Iframe */}
      {isOpen && (
        <iframe
          src={embedUrl}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '600px',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
            zIndex: 999999,
          }}
          title="Chatbot"
        />
      )}
    </>
  );
}

export default ChatbotWidget;

// Usage: Add <ChatbotWidget /> to your App.js or layout`;

      case "nextjs":
        return `// Create: components/ChatbotWidget.tsx
'use client';

import { useEffect, useState } from 'react';

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
        className="fixed bottom-5 right-5 w-[60px] h-[60px] rounded-full border-none text-white text-[28px] cursor-pointer shadow-2xl z-[999999] transition-transform hover:scale-110"
        style={{
          background: isOpen 
            ? '#ef4444' 
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <iframe
          src={embedUrl}
          className="fixed bottom-[90px] right-5 w-[400px] h-[600px] border-none rounded-xl shadow-2xl z-[999999]"
          title="Chatbot"
        />
      )}
    </>
  );
}

// Usage: Add to app/layout.tsx
import ChatbotWidget from '@/components/ChatbotWidget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}`;

      case "vue":
        return `<!-- Create: components/ChatbotWidget.vue -->
<template>
  <div>
    <button
      @click="toggleChat"
      @mouseover="hovered = true"
      @mouseleave="hovered = false"
      :style="buttonStyle"
      class="chat-button"
    >
      {{ isOpen ? '✕' : '💬' }}
    </button>

    <iframe
      v-if="isOpen"
      :src="embedUrl"
      class="chat-iframe"
      title="Chatbot"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      isOpen: false,
      hovered: false,
      embedUrl: '${embedUrl}',
    };
  },
  computed: {
    buttonStyle() {
      return {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        background: this.isOpen 
          ? '#ef4444' 
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        fontSize: '28px',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 999999,
        transform: this.hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s',
      };
    },
  },
  methods: {
    toggleChat() {
      this.isOpen = !this.isOpen;
    },
  },
  mounted() {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = this.embedUrl;
    document.head.appendChild(link);
  },
};
</script>

<style scoped>
.chat-iframe {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 400px;
  height: 600px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0,0,0,0.2);
  z-index: 999999;
}
</style>

<!-- Usage: Add to App.vue -->
<!-- <ChatbotWidget /> -->`;

      case "angular":
        return `// Create: src/app/chatbot-widget/chatbot-widget.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-chatbot-widget',
  template: \`
    <button
      (click)="toggleChat()"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false"
      [ngStyle]="buttonStyle"
      class="chat-button"
    >
      {{ isOpen ? '✕' : '💬' }}
    </button>

    <iframe
      *ngIf="isOpen"
      [src]="embedUrl"
      class="chat-iframe"
      title="Chatbot"
    ></iframe>
  \`,
  styles: [\`
    .chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 999999;
      transition: transform 0.2s;
    }

    .chat-iframe {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.2);
      z-index: 999999;
    }
  \`]
})
export class ChatbotWidgetComponent implements OnInit {
  isOpen = false;
  hovered = false;
  embedUrl = '${embedUrl}';

  get buttonStyle() {
    return {
      background: this.isOpen 
        ? '#ef4444' 
        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      transform: this.hovered ? 'scale(1.1)' : 'scale(1)',
    };
  }

  ngOnInit() {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = this.embedUrl;
    document.head.appendChild(link);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }
}

// Usage: Add to app.component.html
// <app-chatbot-widget></app-chatbot-widget>`;

      case "flutter":
        return `// Add to pubspec.yaml:
// dependencies:
//   webview_flutter: ^4.4.2

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ChatbotWidget extends StatefulWidget {
  @override
  _ChatbotWidgetState createState() => _ChatbotWidgetState();
}

class _ChatbotWidgetState extends State<ChatbotWidget> {
  bool isOpen = false;
  final String embedUrl = '${embedUrl}';

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Chat Button
        Positioned(
          bottom: 20,
          right: 20,
          child: GestureDetector(
            onTap: () {
              setState(() {
                isOpen = !isOpen;
              });
            },
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isOpen 
                    ? [Color(0xFFEF4444), Color(0xFFEF4444)]
                    : [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 20,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  isOpen ? '✕' : '💬',
                  style: TextStyle(fontSize: 28, color: Colors.white),
                ),
              ),
            ),
          ),
        ),

        // Chat Iframe
        if (isOpen)
          Positioned(
            bottom: 90,
            right: 20,
            child: Container(
              width: 400,
              height: 600,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 30,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: WebViewWidget(
                  controller: WebViewController()
                    ..setJavaScriptMode(JavaScriptMode.unrestricted)
                    ..loadRequest(Uri.parse(embedUrl)),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// Usage: Add to your main screen
// Stack(
//   children: [
//     YourMainContent(),
//     ChatbotWidget(),
//   ],
// )`;

      case "react-native":
        return `// Install: npm install react-native-webview
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { WebView } from 'react-native-webview';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = '${embedUrl}';

  return (
    <View style={styles.container}>
      {/* Chat Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isOpen ? '#ef4444' : '#6366f1' }
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.buttonText}>
          {isOpen ? '✕' : '💬'}
        </Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  buttonText: {
    fontSize: 28,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  webviewContainer: {
    height: '80%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

export default ChatbotWidget;

// Usage: Add to App.js
// <ChatbotWidget />`;

      default:
        return "";
    }
  };

  const frameworks = [
    { id: "html" as Framework, name: "HTML/JavaScript", icon: "🌐" },
    { id: "react" as Framework, name: "React", icon: "⚛️" },
    { id: "nextjs" as Framework, name: "Next.js", icon: "▲" },
    { id: "vue" as Framework, name: "Vue.js", icon: "💚" },
    { id: "angular" as Framework, name: "Angular", icon: "🅰️" },
    { id: "flutter" as Framework, name: "Flutter", icon: "📱" },
    { id: "react-native" as Framework, name: "React Native", icon: "📲" },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chatbot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-indigo-50 via-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Deploy {chatbot.name} 🚀
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Choose your framework and copy the embed code
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
                embed on any platform.
              </p>
            </div>
          </div>

          {/* Framework Tabs */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Select Your Framework
            </h2>
            <div className="flex flex-wrap gap-2">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFramework === fw.id
                      ? "bg-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className="mr-2">{fw.icon}</span>
                  {fw.name}
                </button>
              ))}
            </div>
          </div>

          {/* Embed Code */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Embed Code for{" "}
                {frameworks.find((f) => f.id === selectedFramework)?.name}
              </h2>
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <FiCheck /> Copied!
                  </>
                ) : (
                  <>
                    <FiCopy /> Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 dark:bg-black text-emerald-400 dark:text-emerald-300 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed shadow-lg border border-gray-700 dark:border-gray-600 max-h-[500px] overflow-y-auto">
              <code>{getEmbedCode(selectedFramework)}</code>
            </pre>
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

          {/* Stats */}
          <div className="mt-8 p-6 bg-slate-50 dark:bg-gray-700 rounded-xl border-2 border-slate-200 dark:border-gray-600 shadow-sm">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 text-lg">
              Chatbot Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                  Chatbot Name
                </p>
                <p className="font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-slate-200 dark:border-gray-600">
                  {chatbot.name}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                  Chatbot ID
                </p>
                <p className="font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-slate-200 dark:border-gray-600">
                  {chatbot.chatbotId}
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
        </div>
      </div>
    </div>
  );
}
