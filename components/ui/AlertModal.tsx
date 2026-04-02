"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiCheck, FiInfo, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "danger" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirm = false,
}: AlertModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const config = {
    danger: {
      icon: <FiAlertTriangle className="text-[#ef4444]" size={24} />,
      accent: "bg-[#ef4444]/10",
      button: "bg-[#ef4444] hover:bg-[#dc2626] text-white",
    },
    success: {
      icon: <FiCheck className="text-[#10b981]" size={24} />,
      accent: "bg-[#10b981]/10",
      button: "bg-[#10b981] hover:bg-[#059669] text-white",
    },
    info: {
      icon: <FiInfo className="text-[#EAB564]" size={24} />,
      accent: "bg-[#EAB564]/10",
      button: "bg-[#EAB564] hover:bg-[#D4924A] text-[#1A1714]",
    },
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0908]/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-[#F7F4EF] border border-[#E2D9CC] rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header / Icon */}
            <div className="p-8 pb-0 flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl ${config.accent} mb-6`}>
                {config.icon}
              </div>
              <h3 
                style={{ fontFamily: 'Georgia, serif' }}
                className="text-2xl font-black text-[#1A1714] mb-2"
              >
                {title}
              </h3>
              <p className="text-[#5C5448] leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="p-8 flex gap-3">
              {isConfirm && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-2xl border border-[#E2D9CC] text-[#1A1714] font-bold hover:bg-[#F0EAE0] transition-colors"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  if (!onConfirm) onClose(); // For alerts
                }}
                className={`flex-1 py-3 px-6 rounded-2xl font-black transition-all ${config.button} shadow-lg shadow-black/5`}
              >
                {confirmText}
              </button>
            </div>

            {/* Close X (optional) */}
            {!isConfirm && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-[#8C7B68] hover:text-[#1A1714] transition-colors"
              >
                <FiX size={20} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
