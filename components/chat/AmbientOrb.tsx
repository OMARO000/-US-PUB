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

  const stateLabel =
    orbState === "recording" ? "[listening…]" :
    orbState === "thinking"  ? "[thinking…]" :
    orbState === "speaking"  ? "[speaking…]" :
    null;

  const ringRecording = isLocked || isRecording;
  const uColor = ringRecording ? "var(--rose)" : "var(--amber)";

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
      onKeyDown={(e) => {
        if (e.code === "Space" && onHoldStart) { e.preventDefault(); onHoldStart(); }
      }}
      onKeyUp={(e) => {
        if (e.code === "Space" && onHoldEnd) { e.preventDefault(); onHoldEnd(); }
      }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "20px", cursor: onHoldStart ? "pointer" : "default",
        userSelect: "none", WebkitUserSelect: "none",
      }}
    >
      <div style={{
        width: "80px", height: "80px", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid ${ringRecording ? "rgba(196,132,138,0.15)" : isSpeaking ? "rgba(196,151,74,0.18)" : "rgba(196,151,74,0.09)"}`,
          animation: "oring 3s ease-in-out infinite 0.5s",
        }} />
        {/* inner ring */}
        <div style={{
          position: "absolute", inset: "12px", borderRadius: "50%",
          border: `1px solid ${ringRecording ? "rgba(196,132,138,0.35)" : isSpeaking ? "rgba(196,151,74,0.45)" : "rgba(196,151,74,0.22)"}`,
          animation: `oring ${ringRecording ? "0.9s" : isSpeaking ? "1.4s" : "3s"} ease-in-out infinite`,
        }} />
        {/* [u] center — replaces dot */}
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          fontWeight: 400,
          letterSpacing: "0.04em",
          color: uColor,
          opacity: isThinking ? 0.4 : 1,
          animation: `${ringRecording ? "recpulse 0.9s" : isThinking ? "pulse 1.2s" : isSpeaking ? "obreathe 1.4s" : "obreathe 3s"} ease-in-out infinite`,
          userSelect: "none",
          pointerEvents: "none",
        }}>
          [u]
        </span>
      </div>

      {stateLabel && (
        <span aria-live="polite" aria-atomic="true" style={{
          fontSize: "13px", fontFamily: "var(--font-mono)",
          color: orbState === "recording" ? "var(--rose)" : orbState === "speaking" ? "var(--amber)" : "var(--muted)",
          letterSpacing: "0.1em",
          animation: orbState === "thinking" ? "hintpulse 1.2s ease-in-out infinite" :
                     orbState === "speaking"  ? "hintpulse 1.4s ease-in-out infinite" : "none",
        }}>
          {stateLabel}
        </span>
      )}
    </div>
  );
}
