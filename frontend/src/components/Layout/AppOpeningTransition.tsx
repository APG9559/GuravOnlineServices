import { useState, useEffect } from "react";

// A curated palette of beautiful, vibrant colors for the transition
const TRANSITION_PALETTE = [
  "var(--accent)", // Brand yellow
  "#f59e0b",       // Warm Amber
  "#e11d48",       // Coral Rose
  "#3b82f6",       // Electric Blue
  "#10b981",       // Mint Green
  "#8b5cf6",       // Purple
  "#06b6d4",       // Deep Teal
  "#ec4899",       // Hot Pink
];

export default function AppOpeningTransition({ onComplete }: { onComplete?: () => void }) {
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    // Stagger delay max is 400ms (5 layers), animation duration is 1800ms.
    // Total duration is 2200ms. We set timer to 2200ms to unmount on finish.
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Pick 5 random distinct colors on mount for a fresh look every opening
  const [colors] = useState(() => {
    const shuffled = [...TRANSITION_PALETTE].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 99999,
        pointerEvents: "auto", // Blocks clicks during transition
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #f4f3ef)", // Solid background covers the default suspense card underneath
        animation: "containerFadeOut 2.2s forwards",
      }}
    >
      <style>{`
        @keyframes containerFadeOut {
          0%, 85% {
            opacity: 1;
            visibility: visible;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes squareGrow {
          0% {
            transform: translate(-50%, -50%) scale(0);
            border-radius: 40px;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          /* Covered / hold phase: all squares scaled to 1 to cover screen */
          35%, 75% {
            transform: translate(-50%, -50%) scale(1);
            border-radius: 36px;
            opacity: 1;
          }
          /* Exit phase: squares scale up off-screen and fade out */
          100% {
            transform: translate(-50%, -50%) scale(3.5);
            border-radius: 20px;
            opacity: 0;
          }
        }

        .transition-square {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200vmax;
          height: 200vmax;
          transform: translate(-50%, -50%) scale(0); /* Keeps squares hidden and centered during delay */
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        @keyframes logoPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          35%, 75% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        .transition-logo-container {
          position: relative;
          z-index: 100000;
          pointer-events: none;
          animation: logoPop 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 150ms;
        }
      `}</style>

      {/* Render the 5 growing squares with staggered delays */}
      {colors.map((color, index) => {
        const delay = index * 100; // 0ms, 100ms, 200ms, 300ms, 400ms
        return (
          <div
            key={index}
            className="transition-square"
            style={{
              background: color,
              // Stagger layers in z-index. The last color is on top.
              zIndex: 10 + index,
              // Slight brightness tweak for depth
              filter: `brightness(${0.9 + index * 0.05})`,
              animation: `squareGrow 2.0s cubic-bezier(0.76, 0, 0.24, 1) forwards`,
              animationDelay: `${delay}ms`,
            }}
          />
        );
      })}

      {/* Floating Logo card in center */}
      <div className="transition-logo-container">
        <div
          style={{
            width: isMobile ? 120 : 160,
            height: isMobile ? 120 : 160,
            background: "#ffffff",
            border: isMobile ? "4px solid var(--border)" : "5px solid var(--border)",
            borderRadius: isMobile ? "24px" : "36px",
            boxShadow: `${isMobile ? "5px 5px" : "8px 8px"} 0px var(--border)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: isMobile ? 14 : 20,
          }}
        >
          <img
            src="/G.png"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            alt="G Logo"
          />
        </div>
      </div>
    </div>
  );
}
