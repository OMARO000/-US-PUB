"use client";
import { useEffect, useRef, useState } from "react";
import AmbientOrb from "./AmbientOrb";
import SlideLock from "./SlideLock";

interface TalkModeProps {
  isRecording: boolean;
  isLocked: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLock: () => void;
}

export default function TalkMode({
  isRecording, isLocked, onStartRecording, onStopRecording, onLock
}: TalkModeProps) {
  const [secs, setSecs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      setSecs(0);
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecs(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      onMouseDown={() => { if (!isLocked) onStartRecording(); }}
      onMouseUp={() => { if (!isLocked) onStopRecording(); }}
      onTouchStart={(e) => { e.preventDefault(); if (!isLocked) onStartRecording(); }}
      onTouchEnd={() => { if (!isLocked) onStopRecording(); }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <AmbientOrb isRecording={isRecording} />

      {isRecording && (
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--rose)",
          letterSpacing: "0.1em",
        }}>
          {formatTime(secs)}
        </div>
      )}

      {!isRecording && (
        <div style={{
          fontSize: "11px",
          color: "var(--dim)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.07em",
        }}>
          [hold anywhere to speak]
        </div>
      )}

      {isRecording && !isLocked && <SlideLock onLock={onLock} />}

      {isLocked && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "20px",
          background: "rgba(196,151,74,0.1)",
          border: "1px solid rgba(196,151,74,0.22)",
        }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--amber)",
            animation: "recpulse 1s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--amber)", letterSpacing: "0.05em" }}>
            [recording locked]
          </span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onStopRecording(); }}
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              background: "transparent",
              border: "1px solid var(--border2)",
              borderRadius: "12px",
              padding: "3px 10px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            [done]
          </button>
        </div>
      )}
    </div>
  );
}
