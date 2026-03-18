"use client";
import Link from "next/link";

export default function NotFound() {
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
        fontSize: "48px",
        fontFamily: "var(--font-mono)",
        color: "var(--amber)",
        fontWeight: 300,
        letterSpacing: "-1px",
      }}>
        [404]
      </div>
      <div style={{
        fontSize: "18px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
      }}>
        this page doesn't exist.
      </div>
      <div style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        fontWeight: 300,
        textAlign: "center",
        lineHeight: 1.8,
      }}>
        you might be looking for{" "}
        <Link href="/conversation" style={{ color: "var(--amber)", textDecoration: "none" }}>[conversation]</Link>
        {", "}
        <Link href="/connections" style={{ color: "var(--amber)", textDecoration: "none" }}>[connections]</Link>
        {", or "}
        <Link href="/profile" style={{ color: "var(--amber)", textDecoration: "none" }}>[profile]</Link>
        {"."}
      </div>
    </div>
  );
}
