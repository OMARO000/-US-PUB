"use client";

export type OrbState = "idle" | "recording" | "thinking" | "speaking";

interface AmbientOrbProps {
  isRecording: boolean;
  orbState?: OrbState;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

export default function AmbientOrb({
  isRecording,
  orbState = "idle",
  isLocked = false,
  onToggleLock,
  onHoldStart,
  onHoldEnd,
}: AmbientOrbProps) {
  const isThinking = orbState === "thinking";
  const isSpeaking = orbState === "speaking";
  const isActive = isLocked || isRecording;

  const stateLabel =
    orbState === "recording" ? "[listening…]" :
    orbState === "thinking"  ? "[thinking…]" :
    orbState === "speaking"  ? "[speaking…]" :
    null;

  const uColor = isActive ? "var(--rose)" : "var(--amber)";

  const animation =
    isActive    ? "heartbeat 0.6s ease-in-out infinite" :
    isThinking  ? "heartbeat 1.2s ease-in-out infinite" :
    isSpeaking  ? "heartbeat 0.9s ease-in-out infinite" :
    "heartbeat 2.4s ease-in-out infinite";

  return (
    <div
      role={onHoldStart ? "button" : undefined}
      tabIndex={onHoldStart ? 0 : undefined}
      aria-label={onHoldStart ? "hold to speak" : undefined}
      onMouseDown={onHoldStart}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={(e) => { e.preventDefault(); onHoldStart?.(); }}
      onTouchEnd={onHoldEnd}
      onKeyDown={(e) => { if (e.code === "Space" && onHoldStart) { e.preventDefault(); onHoldStart(); } }}
      onKeyUp={(e) => { if (e.code === "Space" && onHoldEnd) { e.preventDefault(); onHoldEnd(); } }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        cursor: onHoldStart ? "pointer" : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <style>{`
        @keyframes heartbeat {
          0%   { transform: scale(1);    opacity: 1; }
          14%  { transform: scale(1.08); opacity: 1; }
          28%  { transform: scale(1);    opacity: 1; }
          42%  { transform: scale(1.05); opacity: 1; }
          70%  { transform: scale(1);    opacity: 0.85; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes recordpulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%      { transform: scale(1.12); opacity: 0.8; }
        }
      `}</style>

      <div style={{
        width: "80px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "-0.5px",
          color: uColor,
          animation,
          display: "inline-block",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          [u]
        </span>
      </div>

      {stateLabel && (
        <span aria-live="polite" aria-atomic="true" style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: orbState === "recording" ? "var(--rose)" : orbState === "speaking" ? "var(--amber)" : "var(--muted)",
          letterSpacing: "0.1em",
          animation: orbState === "thinking" ? "heartbeat 1.2s ease-in-out infinite" :
                     orbState === "speaking"  ? "heartbeat 0.9s ease-in-out infinite" : "none",
        }}>
          {stateLabel}
        </span>
      )}
    </div>
  );
}
