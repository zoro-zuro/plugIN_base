"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
  centered?: boolean;
  theme?: "light" | "dark";
}

export function SectionHeading({ 
  label, 
  title, 
  description, 
  centered = false,
  theme = "light"
}: SectionHeadingProps) {
  const textColor = theme === "light" ? "text-[#1A1714]" : "text-[#F7F4EF]";
  const labelColor = "#9B7B4E";
  const descColor = theme === "light" ? "text-[#5C5448]" : "text-[#C4B49A]";

  return (
    <div className={`mb-16 sm:mb-24 ${centered ? "text-center flex flex-col items-center" : ""}`}>
      {/* Eyebrow Label + Line */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-8 h-px bg-[#9B7B4E]" />
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7B4E]">
          {label}
        </span>
        {centered && <div className="w-8 h-px bg-[#9B7B4E]" />}
      </motion.div>

      {/* Large Serif Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <h2 
          style={{ fontFamily: 'Georgia, serif' }}
          className={`text-4xl sm:text-5xl lg:text-5xl font-black ${textColor} leading-[1.1]`}
        >
          {title}
        </h2>
      </motion.div>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`mt-6 max-w-2xl text-base sm:text-lg lg:text-xl font-normal ${descColor} leading-relaxed`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
