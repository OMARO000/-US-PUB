"use client";

interface ChatHeaderProps {
  mode: "talk" | "text";
  isRecording: boolean;
  isLocked: boolean;
}

export default function ChatHeader({ mode, isRecording, isLocked }: ChatHeaderProps) {
  const statusText = isLocked
    ? "[recording locked]"
    : isRecording
    ? "[listening…]"
    : mode === "talk"
    ? "[present]"
    : "[listening]";

  return (
    <div style={{
      padding: "16px 24px 14px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* [them] avatar */}
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(196,151,74,0.2), rgba(196,132,138,0.2))",
          border: "1px solid rgba(196,151,74,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            inset: "-3px",
            borderRadius: "50%",
            border: "1px solid rgba(196,151,74,0.18)",
            animation: "rpulse 2.4s ease-in-out infinite",
          }} />
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isRecording ? "var(--rose)" : "var(--amber)",
            animation: isRecording ? "recpulse 0.9s ease-in-out infinite" : "pulse 2.4s ease-in-out infinite",
          }} />
        </div>
        <div>
          <div style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--amber)",
            letterSpacing: "-0.01em",
          }}>
            [you]
          </div>
          <div style={{
            fontSize: "12px",
            color: "var(--muted)",
            fontWeight: 300,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.01em",
          }}>
            {statusText}
          </div>
        </div>
      </div>
      <button
        aria-label="more options"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>
  );
}
