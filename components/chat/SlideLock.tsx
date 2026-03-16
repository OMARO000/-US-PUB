"use client";
import { useRef, useState } from "react";

interface SlideLockProps {
  onLock: () => void;
}

export default function SlideLock({ onLock }: SlideLockProps) {
  const [pct, setPct] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const slidingRef = useRef(false);

  const triggerLock = () => {
    setPct(1);
    onLock();
  };

  const startSlide = (clientX: number) => {
    slidingRef.current = true;
    const rect = sliderRef.current!.getBoundingClientRect();
    const maxLeft = rect.width - 32;

    const onMove = (x: number) => {
      if (!slidingRef.current) return;
      const p = Math.min(1, Math.max(0, (x - rect.left - 16) / maxLeft));
      setPct(p);
      if (p >= 0.92) {
        slidingRef.current = false;
        triggerLock();
        cleanup();
      }
    };

    const onUp = () => {
      if (!slidingRef.current) return;
      slidingRef.current = false;
      setPct(0);
      cleanup();
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX);

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(1, pct + 0.1);
      setPct(next);
      if (next >= 0.92) triggerLock();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setPct(0);
    }
  };

  // Thumb sits inside 148px track; account for 44px min touch target height by expanding container
  const thumbLeft = `${4 + pct * (148 - 44)}px`;

  return (
    <div
      ref={sliderRef}
      role="slider"
      aria-label="slide to lock"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      tabIndex={0}
      onMouseDown={(e) => { e.stopPropagation(); startSlide(e.clientX); }}
      onTouchStart={(e) => { e.stopPropagation(); startSlide(e.touches[0].clientX); }}
      onKeyDown={handleKeyDown}
      style={{
        position: "relative",
        width: "148px",
        height: "44px",
        background: "var(--bg2)",
        borderRadius: "22px",
        border: "1px solid var(--border2)",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* fill */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: `${pct * 100}%`,
        background: "rgba(196,151,74,0.15)",
        borderRadius: "22px",
        transition: "width 0.05s",
      }} />
      {/* thumb — 44×44 touch target */}
      <div style={{
        position: "absolute",
        left: thumbLeft,
        top: "0px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "var(--amber)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: slidingRef.current ? "none" : "left 0.1s",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      {/* label */}
      <span style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}>
        [slide to lock]
      </span>
    </div>
  );
}
