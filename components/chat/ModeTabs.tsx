"use client";

interface ModeTabsProps {
  mode: "talk" | "text";
  onSwitch: (mode: "talk" | "text") => void;
}

export default function ModeTabs({ mode, onSwitch }: ModeTabsProps) {
  return (
    <div style={{
      display: "flex",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {(["talk", "text"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onSwitch(m)}
          style={{
            flex: 1,
            padding: "10px 0",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            color: mode === m ? "var(--amber)" : "var(--dim)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "color 0.15s",
          }}
        >
          [{m}]
          {mode === m && (
            <span style={{
              position: "absolute",
              bottom: "-1px",
              left: "25%",
              right: "25%",
              height: "1px",
              background: "var(--amber)",
            }} />
          )}
        </button>
      ))}
    </div>
  );
}
