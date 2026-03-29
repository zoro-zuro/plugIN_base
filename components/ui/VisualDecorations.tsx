"use client";

import { motion } from "framer-motion";

export function IsometricCube({ color = "gold", size = "md", className = "" }: { color?: "gold" | "ink", size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl", className?: string }) {
  const scales: Record<string, number> = { sm: 0.6, md: 1, lg: 1.5, xl: 2.2, "2xl": 3.2, "3xl": 4.8 };
  const scale = scales[size] || 1;
  
  const colors = {
    gold: { top: "#EAB564", left: "#D4924A", right: "#C87A38" },
    ink: { top: "#1A1714", left: "#2E2820", right: "#111009" }
  };
  const c = colors[color];

  return (
    <motion.svg
      width={100 * scale}
      height={110 * scale}
      viewBox="0 0 100 110"
      className={`absolute opacity-[0.22] pointer-events-none select-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 0.22, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      aria-hidden="true"
    >
      {/* Isometric Cube Faces */}
      <path d="M50 10 L85 30 L50 50 L15 30 Z" fill={c.top} />
      <path d="M15 30 L50 50 L50 90 L15 70 Z" fill={c.left} />
      <path d="M50 50 L85 30 L85 70 L50 90 Z" fill={c.right} />
    </motion.svg>
  );
}

export function DotGrid({ color = "gold", className = "" }: { color?: "gold" | "ink", className?: string }) {
  const dotColor = color === "gold" ? "#EAB564" : "#9B7B4E";
  const columns = 8;
  const rows = 10;
  const spacing = 40;

  return (
    <svg 
      width={columns * spacing} 
      height={rows * spacing} 
      className={`absolute opacity-10 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {[...Array(rows)].map((_, r) => (
        [...Array(columns)].map((_, c) => (
          <circle 
            key={`${r}-${c}`}
            cx={20 + c * spacing} 
            cy={20 + r * spacing} 
            r="1.4" 
            fill={dotColor} 
            opacity={0.18 - r * 0.015} // Perspective fade
          />
        ))
      ))}
    </svg>
  );
}

export function DiagonalFan({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute opacity-[0.12] pointer-events-none select-none ${className}`}>
      {[...Array(6)].map((_, i) => (
        <div 
          key={i}
          className="h-px bg-gradient-to-r from-[#9B7B4E] to-transparent"
          style={{ 
            width: "300px", 
            transform: `rotate(-45deg) translateY(${i * 24}px)`,
            opacity: 1 - i * 0.15 
          }}
        />
      ))}
    </div>
  );
}
