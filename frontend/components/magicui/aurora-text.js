"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export const AuroraText = ({
  children,
  className,
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1,
}) => {
  const containerRef = useRef(null);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !gradientRef.current) return;

    const container = containerRef.current;
    const gradient = gradientRef.current;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gradient.style.setProperty("--x", `${x}px`);
      gradient.style.setProperty("--y", `${y}px`);
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block cursor-default group", className)}
    >
      {/* Background aurora effect */}
      <div
        ref={gradientRef}
        className="pointer-events-none absolute -inset-px rounded-xl opacity-75 mix-blend-overlay"
        style={{
          background: `radial-gradient(600px circle at var(--x) var(--y), ${colors.map(
            (color, index) =>
              `${color}${Math.round((0.8 / colors.length) * index * 100)}`,
          )}, transparent 40%)`,
          animation: `aurora ${3 / speed}s linear infinite`,
          transform: 'translateX(0)',
          willChange: 'transform'
        }}
      />
      {/* Main text with gradient */}
      <div className="relative z-10 bg-clip-text">
        <span className="animate-colorful font-bold">
          {children}
        </span>
      </div>
    </div>
  );
}; 