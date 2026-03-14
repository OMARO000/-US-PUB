"use client";

interface AmbientOrbProps {
  isRecording: boolean;
}

export default function AmbientOrb({ isRecording }: AmbientOrbProps) {
  return (
    <div style={{
      width: "80px",
      height: "80px",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      {/* outer ring */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `1px solid ${isRecording ? "rgba(196,132,138,0.15)" : "rgba(196,151,74,0.09)"}`,
        animation: "oring 3s ease-in-out infinite 0.5s",
      }} />
      {/* inner ring */}
      <div style={{
        position: "absolute",
        inset: "12px",
        borderRadius: "50%",
        border: `1px solid ${isRecording ? "rgba(196,132,138,0.35)" : "rgba(196,151,74,0.22)"}`,
        animation: `oring ${isRecording ? "0.9s" : "3s"} ease-in-out infinite`,
      }} />
      {/* core */}
      <div style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: isRecording ? "var(--rose)" : "var(--amber)",
        animation: `${isRecording ? "recpulse 0.9s" : "obreathe 3s"} ease-in-out infinite`,
      }} />
    </div>
  );
}
