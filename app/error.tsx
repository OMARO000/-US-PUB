"use client";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      background: "var(--bg)",
      gap: "16px",
      padding: "40px",
    }}>
      <div style={{
        fontSize: "24px",
        fontFamily: "var(--font-mono)",
        color: "var(--amber)",
        fontWeight: 300,
        letterSpacing: "-0.5px",
      }}>
        [something went wrong]
      </div>
      <div style={{
        fontSize: "18px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
      }}>
        an unexpected error occurred.
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          onClick={reset}
          style={{
            background: "transparent",
            border: "1px solid var(--amber)",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--amber)",
          }}
        >
          [try again]
        </button>
        <Link
          href="/conversation"
          style={{
            display: "flex",
            alignItems: "center",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--muted)",
            textDecoration: "none",
          }}
        >
          [go home]
        </Link>
      </div>
    </div>
  );
}
