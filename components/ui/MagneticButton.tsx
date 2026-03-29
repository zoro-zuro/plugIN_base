"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

export function MagneticButton({ 
  children, 
  className = "", 
  onClick,
  variant = "primary"
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for the "pull" effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for the pull
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Calculate distance from center (normalized -0.5 to 0.5)
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Pull intensity (0.3 = 30% of movement)
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variants = {
    primary: "bg-[#EAB564] text-[#1A1714] shadow-2xl shadow-[#EAB564]/20 hover:shadow-[#EAB564]/40",
    secondary: "bg-[#1A1714] text-[#F7F4EF] border border-[#EAB564]/30 hover:border-[#EAB564]",
    ghost: "bg-transparent text-[#9B7B4E] hover:text-[#EAB564] border border-transparent"
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative p-4" // Padding increases the "magnetic" area
    >
      <motion.button
        onClick={onClick}
        style={{ x: springX, y: springY }}
        className={`px-8 py-4 rounded-2xl font-bold transition-shadow duration-300 ${variants[variant]} ${className}`}
      >
        {children}
      </motion.button>
    </div>
  );
}
