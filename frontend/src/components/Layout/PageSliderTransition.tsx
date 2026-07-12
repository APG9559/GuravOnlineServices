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

export default function PageSliderTransition({ onComplete }: { onComplete?: () => void }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Performance & visual scale optimization for mobile:
  // Less columns on mobile makes drips wider (looks better on narrow screen) and saves rendering performance.
  const barCount = isMobile ? 6 : 10;
  const delays = isMobile 
    ? [0, 60, 30, 90, 45, 75] 
    : [0, 80, 40, 120, 60, 150, 20, 100, 70, 130];
  
  // Lower blur radius stdDeviation on mobile simplifies calculations for mobile GPUs
  const stdDev = isMobile ? 8 : 12;

  // Pick one random theme color for the entire drip curtain on mount
  const [baseColor] = useState(() => {
    const index = Math.floor(Math.random() * TRANSITION_PALETTE.length);
    return TRANSITION_PALETTE[index];
  });

  const [reduceAnimations] = useState(() => typeof window !== "undefined" && localStorage.getItem("reduce_animations") === "true");

  if (reduceAnimations) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100dvh",
          zIndex: 99999,
          pointerEvents: "auto",
          background: baseColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "simpleFade 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        <style>{`
          @keyframes simpleFade {
            0% { opacity: 0; }
            20%, 80% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes simplePop {
            0% { transform: scale(0.9); opacity: 0; }
            20%, 80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0; }
          }
        `}</style>
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
            animation: "simplePop 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        >
          <img
            src="/G.png"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            alt="G Logo"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh", /* dynamic viewport height for mobile browser bar safety */
        zIndex: 99999,
        pointerEvents: "none",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* SVG gooey filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="goo-transition">
            <feGaussianBlur in="SourceGraphic" stdDeviation={stdDev} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Styled block for animations configured to align with 600ms/1200ms Layout timings */}
      <style>{`
        @keyframes liquidDrip {
          0% {
            transform: translateY(-105%) scaleX(0.85);
            border-bottom-left-radius: 60px;
            border-bottom-right-radius: 60px;
          }
          32%, 65% {
            transform: translateY(0) scaleX(1);
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
          }
          100% {
            transform: translateY(105%) scaleX(0.85);
            border-top-left-radius: 60px;
            border-top-right-radius: 60px;
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
          }
        }

        .dripping-bar {
          flex: 1;
          height: 110dvh;
          margin-top: -5dvh;
          transform: translateY(-105%);
          animation: liquidDrip 1s cubic-bezier(0.76, 0, 0.24, 1) forwards;
          pointer-events: auto;
          
          /* GPU hardware acceleration flags */
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        @keyframes logoPop {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-10deg);
            opacity: 0;
          }
          32%, 65% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0) rotate(10deg);
            opacity: 0;
          }
        }

        .transition-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100000;
          pointer-events: auto;
          animation: logoPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Dripping columns container with gooey filter */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          filter: "url(#goo-transition)",
        }}
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="dripping-bar"
            style={{
              background: baseColor,
              // Apply slight shading variations to make the liquid drops stand out
              filter: `brightness(${0.85 + (i % 3) * 0.15})`,
              animationDelay: `${delays[i]}ms`,
            }}
          />
        ))}
      </div>

      {/* Floating Logo card in center */}
      <div className="transition-logo">
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
