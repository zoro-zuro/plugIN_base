"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  FiPlus,
  FiPlay,
  FiCode,
  FiMessageSquare,
  FiFileText,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import { Zap, Bot, ArrowRight, LayoutGrid, Activity } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";

function ChatbotTotalChats({ chatId }: { chatId: string }) {
  const total = useQuery(api.analytics.getTotalChats, {
    chatbotId: chatId,
  });
  return <span>{total ?? 0}</span>;
}

export default function ManageChatbotsPage() {
  const { user } = useUser();
  const chatbots = useQuery(
    api.documents.getChatbotsByUserId,
    user?.id ? { userId: user.id } : "skip",
  );
  const deleteChatbot = useMutation(api.documents.deleteChatbot);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (chatbot: Doc<"chatbots">) => {
    if (!chatbot) return;
    const confirmed = confirm(`Are you sure you want to delete "${chatbot.name}"?`);
    if (!confirmed) return;
    setDeletingId(chatbot._id);
    try {
      await deleteChatbot({ id: chatbot._id });
      toast.success("Chatbot decommissioned");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <Logo className="h-10 w-10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-0 px-0 bg-[#F7F4EF] relative overflow-hidden flex flex-col">
      <Toaster position="top-right" />
      
      {/* Background Technical Illustration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.035]">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            backgroundImage: `radial-gradient(#1A1714 0.5px, transparent 0.5px)`, 
            backgroundSize: '32px 32px' 
          }} 
        />
        <svg className="absolute top-1/4 -right-20 w-[600px] h-[600px] text-[#1A1714]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.08" fill="none" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.08" fill="none" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.08" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.08" />
        </svg>
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col flex-1 px-6">
        {/* Header Section — Compact & Sophisticated */}
        <header className="flex flex-col md:flex-row items-end justify-between mb-10 px-4 gap-6">
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <Activity className="h-3 w-3 text-[#EAB564]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B7B4E]">
                Active Deployments
              </span>
            </motion.div>
            <h1 style={{ fontFamily: 'Georgia, serif' }} className="text-3xl font-black text-[#1A1714] tracking-tight">
              My Chatbots
            </h1>
          </div>
          
          <Link
            href="/chatbot/create"
            className="group px-6 py-3 bg-[#1A1714] text-[#F7F4EF] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#2E2820] transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(26,23,20,0.15)] active:scale-95"
          >
            <FiPlus size={14} className="text-[#EAB564]" />
            New Chatbot
          </Link>
        </header>

        {/* Endless 'Hollow' Container with Inset Shadow */}
        <div 
          className="relative rounded-t-[3rem] rounded-b-none p-8 lg:p-12 lg:pb-24 bg-[#FFFFFF] border border-[#E2D9CC]/80 border-b-0 shadow-[inset_0_2px_18px_rgba(26,23,20,0.06)] flex-1"
          style={{
            background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(to bottom, #E2D9CC 0%, rgba(226,217,204,0) 100%) border-box",
          }}
        >
          {chatbots === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#F7F4EF]/40 border border-[#E2D9CC]/30 rounded-3xl p-6 h-64 animate-pulse" />
              ))}
            </div>
          ) : chatbots.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full max-h-[500px] p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F7F4EF] flex items-center justify-center mb-6 border border-[#E2D9CC]/50">
                <Logo className="h-8 w-8 opacity-20" />
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-black mb-2 text-[#1A1714]">The registry is empty</h2>
              <p className="text-sm text-[#5C5448] mb-8 max-w-xs">No chatbots deployed in this sector. Deploy your first conversational engine to begin.</p>
              <Link href="/chatbot/create" className="px-8 py-3.5 bg-[#EAB564] text-[#1A1714] rounded-xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-[#EAB564]/30 transition-all">
                Initialize Chatbot
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {chatbots.map((chatbot, i) => (
                <motion.div
                  key={chatbot._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-[#FFFFFF] border border-[#E2D9CC]/60 rounded-[2rem] p-6 hover:shadow-[0_12px_44px_rgba(26,23,20,0.08)] hover:border-[#EAB564]/30 transition-all duration-500 flex flex-col h-full relative"
                >
                  {/* Compact Bot Identity */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-10 w-10 rounded-xl bg-[#1A1714] flex items-center justify-center text-[#EAB564] font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                      {chatbot.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={() => handleDelete(chatbot)}
                      className="p-1.5 text-[#8C7B68]/30 hover:text-[#FF5F57] hover:bg-[#FF5F57]/5 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>

                  <div className="mb-6 flex-1">
                    <h3
                      style={{ fontFamily: 'Georgia, serif' }}
                      className="text-lg font-black mb-1.5 text-[#1A1714] truncate"
                    >
                      {chatbot.name}
                    </h3>
                    <p className="text-[12px] text-[#5C5448] line-clamp-2 leading-relaxed opacity-75">
                      {chatbot.description || "Active high-fidelity RAG chatbot deployment."}
                    </p>
                  </div>

                  {/* High-Precision Statistics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#F7F4EF]/50 rounded-xl p-3 border border-[#E2D9CC]/30">
                      <div className="text-lg font-black text-[#1A1714]">
                        <ChatbotTotalChats chatId={chatbot.chatbotId} />
                      </div>
                      <div className="text-[9px] text-[#9B7B4E] font-bold uppercase tracking-[0.2em] opacity-80">Queries</div>
                    </div>
                    <div className="bg-[#FFFFFF] rounded-xl p-3 border border-[#E2D9CC]/50">
                      <div className="text-lg font-black text-[#1A1714]">
                        {chatbot.totalDocuments || 0}
                      </div>
                      <div className="text-[9px] text-[#9B7B4E] font-bold uppercase tracking-[0.2em] opacity-80">Sources</div>
                    </div>
                  </div>

                  {/* Concise Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/${chatbot.chatbotId}/playground`}
                      className="flex-[1.4] py-2.5 bg-[#EAB564] text-[#1A1714] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#D4924A] transition-all hover:shadow-lg shadow-[#EAB564]/10"
                    >
                      <FiPlay size={9} className="fill-current" />
                      Open
                    </Link>

                    <Link
                      href={`/dashboard/${chatbot.chatbotId}/deploy`}
                      className="flex-1 py-2.5 bg-white border border-[#E2D9CC] text-[#1A1714] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7F4EF] transition-all"
                    >
                      <FiCode size={11} />
                      Embed
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
