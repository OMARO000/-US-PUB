"use client";

export type OrbState = "idle" | "recording" | "thinking" | "speaking";

interface AmbientOrbProps {
  isRecording: boolean;
  orbState?: OrbState;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

export default function AmbientOrb({ isRecording, orbState = "idle", onHoldStart, onHoldEnd }: AmbientOrbProps) {
  const isThinking = orbState === "thinking";
  const isSpeaking = orbState === "speaking";

  const stateLabel =
    orbState === "recording" ? "[listening…]" :
    orbState === "thinking"  ? "[thinking…]" :
    orbState === "speaking"  ? "[speaking…]" :
    null;

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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        cursor: onHoldStart ? "pointer" : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div style={{
        width: "80px",
        height: "80px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1px solid ${isRecording ? "rgba(196,132,138,0.15)" : isSpeaking ? "rgba(196,151,74,0.18)" : "rgba(196,151,74,0.09)"}`,
          animation: "oring 3s ease-in-out infinite 0.5s",
        }} />
        <div style={{
          position: "absolute",
          inset: "12px",
          borderRadius: "50%",
          border: `1px solid ${isRecording ? "rgba(196,132,138,0.35)" : isSpeaking ? "rgba(196,151,74,0.45)" : "rgba(196,151,74,0.22)"}`,
          animation: `oring ${isRecording ? "0.9s" : isSpeaking ? "1.4s" : "3s"} ease-in-out infinite`,
        }} />
        <div style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: isRecording ? "var(--rose)" : "var(--amber)",
          opacity: isThinking ? 0.4 : 1,
          animation: `${isRecording ? "recpulse 0.9s" : isThinking ? "pulse 1.2s" : isSpeaking ? "obreathe 1.4s" : "obreathe 3s"} ease-in-out infinite`,
        }} />
      </div>

      {/* State label — announced to screen readers via aria-live */}
      <span aria-live="polite" aria-atomic="true">
        {orbState === "idle" && (
          <span style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.06em",
              animation: "hintpulse 2.8s ease-in-out infinite",
            }}>
              [hold anywhere to speak]
            </span>
            <span style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "rgba(196,151,74,0.75)",
              letterSpacing: "0.1em",
            }}>
              [slide to lock]
            </span>
          </span>
        )}

        {stateLabel && (
          <span style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: orbState === "recording" ? "var(--rose)" : orbState === "speaking" ? "var(--amber)" : "var(--muted)",
            letterSpacing: "0.1em",
            animation: orbState === "thinking" ? "hintpulse 1.2s ease-in-out infinite" :
                       orbState === "speaking"  ? "hintpulse 1.4s ease-in-out infinite" : "none",
          }}>
            {stateLabel}
          </span>
        )}
      </span>
    </div>
  );
}
