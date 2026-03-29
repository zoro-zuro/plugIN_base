"use client";

import { memo, useEffect, useRef, useState } from "react";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore – react-simple-maps ships its own types, suppress the missing-declaration warning
import { ComposableMap, Geographies, Geography, Marker, Sphere, Graticule } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WorldGlobe = memo(function WorldGlobe({
  markers = [],
  isLive = true,
  lightMode = false,
  isDarkCard = false,
}: {
  markers?: Array<{ location: [number, number]; size: number; label?: string }>;
  isLive?: boolean;
  lightMode?: boolean;
  isDarkCard?: boolean;
}) {
  const [rotation, setRotation] = useState<[number, number, number]>([0, -20, 0]);
  const [mounted, setMounted] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const rotationRef = useRef<[number, number, number]>([0, -20, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate when isLive, stop when Static
  useEffect(() => {
    if (!mounted || !isLive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = () => {
      // PERFORMANCE GUARD: Only rotate if window is focused
      if (!isDragging.current && document.hasFocus()) {
        rotationRef.current = [
          rotationRef.current[0] + 0.2, // Decelerated for main-thread stability
          rotationRef.current[1],
          rotationRef.current[2],
        ];
        setRotation([...rotationRef.current]);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isLive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    rotationRef.current = [
      rotationRef.current[0] + dx * 0.5,
      rotationRef.current[1],
      rotationRef.current[2],
    ];
    setRotation([...rotationRef.current]);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!mounted) {
    return (
      <div className="relative w-full aspect-square bg-transparent rounded-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full select-none">
      {/* Globe SVG */}
      <div
        className="w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ rotate: rotation, scale: 190 }}
          width={400}
          height={400}
          style={{ width: "100%", height: "auto" }}
          className="relative z-10"
        >
          {/* Outer Global Glow Mask — Only for Dark Context */}
          {isDarkCard && (
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          )}

          {/* Ocean — adaptive: Dark in landing, Parchment-Luminous in Dark Cards */}
          <Sphere
            id="rsm-sphere"
            fill={isDarkCard ? "#F7F4EF" : (lightMode ? "#413B34" : "#1A1714")}
            stroke={isDarkCard ? "#1A1714" : (lightMode ? "#5C5448" : "#2E2822")}
            strokeOpacity={isDarkCard ? 0.3 : 1}
            strokeWidth={0.5}
            style={isDarkCard ? { filter: "url(#glow)" } : {}}
          />

          {/* Lat/Lng grid lines — adaptive grid */}
          <Graticule stroke={isDarkCard ? "rgba(26,23,20,0.15)" : "rgba(234,181,100,0.18)"} strokeWidth={isDarkCard ? 0.4 : 0.4} />

          {/* Countries — adaptive: Radiant Gold or Technical Ink on Parchment */}
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isDarkCard ? "#EADBB6" : (lightMode ? "#5C5448" : "#2C261F")}
                  fillOpacity={isDarkCard ? 0.8 : 1}
                  stroke={isDarkCard ? "#1A1714" : "rgba(234,181,100,0.25)"}
                  strokeOpacity={isDarkCard ? 0.4 : 1}
                  strokeWidth={isDarkCard ? 0.4 : 0.4}
                  style={{
                    default: { outline: "none" },
                    hover:   { fill: isDarkCard ? "#DBC99C" : "#EAB564", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Traffic Markers — glowing gold */}
          {markers.map((marker, i) => (
            <Marker
              key={i}
              coordinates={[marker.location[1], marker.location[0]]}
              onMouseEnter={() => setHoveredLabel(marker.label || "Active Region")}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              {/* Outer pulse ring */}
              <circle
                r={12}
                fill={isDarkCard ? "rgba(234,181,100,0.3)" : "rgba(234,181,100,0.12)"}
                stroke="#EAB564"
                strokeWidth={isDarkCard ? 2 : 1.5}
                style={{ animation: isLive ? "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" : "none" }}
              />
              {/* Inner solid dot */}
              <circle r={5} fill={isDarkCard ? "#F7F4EF" : "#EAB564"} stroke="#EAB564" strokeWidth={1} />
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {hoveredLabel && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-10">
          <div className="bg-card/95 backdrop-blur border border-primary/20 px-3 py-1.5 rounded-lg shadow-xl text-center animate-in fade-in zoom-in duration-200">
            <p className="text-[8px] uppercase text-primary/60 font-bold tracking-widest">
              Traffic Hotspot
            </p>
            <p className="text-sm font-bold text-foreground">{hoveredLabel}</p>
          </div>
        </div>
      )}

      {/* Live indicator badge */}
      {isLive && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-[#EAB564]/60 font-bold uppercase tracking-widest pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EAB564] animate-ping" />
          rotating live
        </div>
      )}
    </div>
  );
});

export default WorldGlobe;
