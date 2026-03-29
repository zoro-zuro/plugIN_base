import React from "react";

export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Soft Gold Outer Ring */}
    <circle 
      cx="50" 
      cy="50" 
      r="44" 
      fill="#EAB564" 
      fillOpacity="0.12" 
      stroke="#EAB564" 
      strokeOpacity="0.3" 
      strokeWidth="1.5" 
    />
    {/* Atmospheric Glow */}
    <circle 
      cx="50" 
      cy="50" 
      r="25" 
      fill="#EAB564" 
      fillOpacity="0.2" 
      className="animate-pulse"
      style={{ animationDuration: '3s' }}
    />
    {/* High-Contrast Sharp Sparkle (Sub-second precision) */}
    <path 
      d="M50 18 
         C51 45 51 45 82 50 
         C51 55 51 55 50 82 
         C49 55 49 55 18 50 
         C49 45 49 45 50 18Z" 
      fill="#1A1714" 
    />
  </svg>
);
