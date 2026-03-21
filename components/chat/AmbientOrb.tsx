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
  const isActive = isLocked || isRecording;
  const isListening = isActive || orbState === "recording";
  const uColor = isActive ? "var(--rose)" : "var(--amber)";

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
        @keyframes nod {
          0%   { transform: translateY(0px);  opacity: 1; }
          20%  { transform: translateY(4px);  opacity: 1; }
          40%  { transform: translateY(0px);  opacity: 1; }
          60%  { transform: translateY(3px);  opacity: 1; }
          80%  { transform: translateY(0px);  opacity: 0.85; }
          100% { transform: translateY(0px);  opacity: 1; }
        }
        @keyframes bodypulse {
          0%,100%{opacity:0.5} 20%{opacity:0.8} 60%{opacity:0.7}
        }
        @keyframes listenpulse {
          0%,100%{opacity:0.8} 50%{opacity:1}
        }
        @keyframes thinkpulse {
          0%,100%{opacity:0.5} 50%{opacity:0.9}
        }
        @keyframes waveout {
          0%{opacity:0;transform:translateX(0px)}
          40%{opacity:0.7}
          100%{opacity:0;transform:translateX(-10px)}
        }
        @keyframes waveout2 {
          0%{opacity:0;transform:translateX(0px)}
          40%{opacity:0.4}
          100%{opacity:0;transform:translateX(-14px)}
        }
        @keyframes waveoutR {
          0%{opacity:0;transform:translateX(0px)}
          40%{opacity:0.7}
          100%{opacity:0;transform:translateX(10px)}
        }
        @keyframes waveoutR2 {
          0%{opacity:0;transform:translateX(0px)}
          40%{opacity:0.4}
          100%{opacity:0;transform:translateX(14px)}
        }
      `}</style>

      {/* IDLE — nodding head, arms down */}
      {!isListening && (
        <svg width="120" height="125" viewBox="0 0 120 125" style={{ overflow: "visible" }}>
          {/* Head [u] — nods */}
          <text
            x="60" y="44"
            fontFamily="var(--font-mono)"
            fontSize="36"
            fontWeight="300"
            fill={uColor}
            textAnchor="middle"
            style={{ animation: "nod 2s ease-in-out infinite", display: "inline-block" }}
          >[u]</text>
          {/* Neck */}
          <line x1="60" y1="52" x2="60" y2="56" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Torso */}
          <line x1="60" y1="56" x2="60" y2="80" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Left arm down */}
          <path d="M 60,64 Q 50,72 44,82" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Right arm down */}
          <path d="M 60,64 Q 70,72 76,82" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Left leg */}
          <path d="M 60,80 Q 52,96 48,112" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Right leg */}
          <path d="M 60,80 Q 68,96 72,112" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Left foot */}
          <path d="M 48,112 Q 42,116 36,114" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
          {/* Right foot */}
          <path d="M 72,112 Q 78,116 84,114" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" style={{ animation: "bodypulse 2s ease-in-out infinite" }}/>
        </svg>
      )}

      {/* LISTENING — arms up, ]u[, waves both sides */}
      {isListening && (
        <svg width="180" height="125" viewBox="0 0 180 125" style={{ overflow: "visible" }}>
          {/* Head ]u[ */}
          <text
            x="90" y="44"
            fontFamily="var(--font-mono)"
            fontSize="36"
            fontWeight="300"
            fill={uColor}
            textAnchor="middle"
            style={{ animation: "listenpulse 0.9s ease-in-out infinite", display: "inline-block" }}
          >{"]u["}</text>
          {/* Neck */}
          <line x1="90" y1="52" x2="90" y2="56" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Torso */}
          <line x1="90" y1="56" x2="90" y2="80" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Left arm UP */}
          <path d="M 90,62 Q 78,56 66,50" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.9"/>
          {/* Right arm UP */}
          <path d="M 90,62 Q 102,56 114,50" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.9"/>
          {/* Left leg */}
          <path d="M 90,80 Q 80,96 76,112" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Right leg */}
          <path d="M 90,80 Q 100,96 104,112" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Left foot */}
          <path d="M 76,112 Q 70,116 64,114" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Right foot */}
          <path d="M 104,112 Q 110,116 116,114" fill="none" stroke={uColor} strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
          {/* Sound waves LEFT */}
          <path d="M 46,30 C 42,36 42,44 46,50" fill="none" stroke={uColor} strokeWidth="2" strokeLinecap="round" style={{ animation: "waveout 1.2s ease-in-out infinite" }}/>
          <path d="M 38,24 C 32,34 32,48 38,58" fill="none" stroke={uColor} strokeWidth="1.5" strokeLinecap="round" style={{ animation: "waveout2 1.2s ease-in-out infinite 0.2s" }}/>
          <path d="M 30,18 C 22,32 22,52 30,66" fill="none" stroke={uColor} strokeWidth="1" strokeLinecap="round" style={{ animation: "waveout2 1.2s ease-in-out infinite 0.4s" }} opacity="0.5"/>
          {/* Sound waves RIGHT */}
          <path d="M 134,30 C 138,36 138,44 134,50" fill="none" stroke={uColor} strokeWidth="2" strokeLinecap="round" style={{ animation: "waveoutR 1.2s ease-in-out infinite" }}/>
          <path d="M 142,24 C 148,34 148,48 142,58" fill="none" stroke={uColor} strokeWidth="1.5" strokeLinecap="round" style={{ animation: "waveoutR 1.2s ease-in-out infinite 0.2s" }}/>
          <path d="M 150,18 C 158,32 158,52 150,66" fill="none" stroke={uColor} strokeWidth="1" strokeLinecap="round" style={{ animation: "waveoutR2 1.2s ease-in-out infinite 0.4s" }} opacity="0.5"/>
        </svg>
      )}

      {stateLabel && (
        <span aria-live="polite" aria-atomic="true" style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: orbState === "recording" ? "var(--rose)" : orbState === "speaking" ? "var(--amber)" : "var(--muted)",
          letterSpacing: "0.1em",
          animation: orbState === "thinking" ? "thinkpulse 1.2s ease-in-out infinite" :
                     orbState === "speaking"  ? "listenpulse 1.4s ease-in-out infinite" : "none",
        }}>
          {stateLabel}
        </span>
      )}
    </div>
  );
}
