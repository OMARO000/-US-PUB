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

  return (
    <div
      onMouseDown={onHoldStart}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={(e) => { e.preventDefault(); onHoldStart?.(); }}
      onTouchEnd={onHoldEnd}
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

      {orbState === "idle" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--amber)",
            letterSpacing: "0.06em",
            animation: "hintpulse 2.8s ease-in-out infinite",
          }}>
            [hold anywhere to speak]
          </div>
          <div style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "rgba(196,151,74,0.35)",
            letterSpacing: "0.1em",
          }}>
            [slide to lock]
          </div>
        </div>
      )}

      {orbState === "recording" && (
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--rose)",
          letterSpacing: "0.1em",
        }}>
          [listening…]
        </div>
      )}

      {orbState === "thinking" && (
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          letterSpacing: "0.1em",
          animation: "hintpulse 1.2s ease-in-out infinite",
        }}>
          [thinking…]
        </div>
      )}

      {orbState === "speaking" && (
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          letterSpacing: "0.1em",
          animation: "hintpulse 1.4s ease-in-out infinite",
        }}>
          [speaking…]
        </div>
      )}
    </div>
  );
}
