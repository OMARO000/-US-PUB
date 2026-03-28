"use client";

export type UFigureState = "idle" | "listening" | "speaking";

interface UFigureProps {
  state?: UFigureState;
}

export default function UFigure({ state = "idle" }: UFigureProps) {
  if (state === "listening") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width="100" height="140" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="34" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="28" fontWeight="400" fill="#E05C5C">]u[</text>
          {/* body */}
          <line x1="50" y1="42" x2="50" y2="64" stroke="#E05C5C" strokeWidth="5.4" strokeLinecap="round"/>
          {/* arms raised */}
          <line x1="50" y1="50" x2="32" y2="38" stroke="#E05C5C" strokeWidth="5.4" strokeLinecap="round"/>
          <line x1="50" y1="50" x2="68" y2="38" stroke="#E05C5C" strokeWidth="5.4" strokeLinecap="round"/>
          {/* legs */}
          <line x1="50" y1="64" x2="36" y2="84" stroke="#E05C5C" strokeWidth="5.4" strokeLinecap="round"/>
          <line x1="50" y1="64" x2="64" y2="84" stroke="#E05C5C" strokeWidth="5.4" strokeLinecap="round"/>
          {/* listening waves left */}
          <path d="M 18 24 Q 12 30 18 36" fill="none" stroke="#E05C5C" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
          <path d="M 13 20 Q 4 30 13 40" fill="none" stroke="#E05C5C" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          {/* listening waves right */}
          <path d="M 82 24 Q 88 30 82 36" fill="none" stroke="#E05C5C" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
          <path d="M 87 20 Q 96 30 87 40" fill="none" stroke="#E05C5C" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace",
          fontWeight: 700,
          fontSize: "11px",
          color: "#E05C5C",
          letterSpacing: "0.08em",
          textAlign: "center",
          marginTop: "6px",
        }}>
          [listening...]
        </div>
      </div>
    );
  }

  if (state === "speaking") {
    return (
      <svg width="90" height="130" viewBox="0 0 90 130" xmlns="http://www.w3.org/2000/svg">
        <text x="45" y="32" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="28" fontWeight="400" fill="#C4974A">[u]</text>
        {/* body */}
        <line x1="45" y1="40" x2="45" y2="64" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
        {/* arms lowered */}
        <line x1="45" y1="48" x2="22" y2="58" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
        <line x1="45" y1="48" x2="68" y2="58" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
        {/* legs */}
        <line x1="45" y1="64" x2="30" y2="86" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
        <line x1="45" y1="64" x2="60" y2="86" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
        {/* speech dots */}
        <circle cx="60" cy="20" r="2.5" fill="#C4974A" opacity="0.6"/>
        <circle cx="68" cy="14" r="3" fill="#C4974A" opacity="0.4"/>
        <circle cx="77" cy="8" r="3.5" fill="#C4974A" opacity="0.2"/>
      </svg>
    );
  }

  // idle
  return (
    <svg width="90" height="130" viewBox="0 0 90 130" xmlns="http://www.w3.org/2000/svg">
      <text x="45" y="32" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="28" fontWeight="400" fill="#C4974A">[u]</text>
      {/* body */}
      <line x1="45" y1="40" x2="45" y2="64" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
      {/* arms */}
      <line x1="45" y1="48" x2="20" y2="42" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
      <line x1="45" y1="48" x2="70" y2="42" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
      {/* legs */}
      <line x1="45" y1="64" x2="30" y2="86" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
      <line x1="45" y1="64" x2="60" y2="86" stroke="#C4974A" strokeWidth="5.4" strokeLinecap="round"/>
    </svg>
  );
}
