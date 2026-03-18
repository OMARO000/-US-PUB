"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("us_cookies_accepted") !== "true") {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("us_cookies_accepted", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "var(--sidebar-width)",
      right: 0,
      zIndex: 30,
      background: "var(--bg)",
      borderTop: "1px solid var(--border)",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "11px",
      fontFamily: "var(--font-mono)",
      color: "var(--muted)",
    }}>
      <span style={{ flex: 1, lineHeight: 1.6 }}>
        we use essential cookies to operate [us]. no tracking, no advertising cookies.
      </span>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <Link
          href="/privacy"
          style={{
            color: "var(--dim)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textDecoration: "none",
            padding: "4px 8px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            whiteSpace: "nowrap",
          }}
        >
          [learn more]
        </Link>
        <button
          onClick={accept}
          style={{
            background: "transparent",
            border: "1px solid var(--amber)",
            borderRadius: "6px",
            padding: "4px 8px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--amber)",
            whiteSpace: "nowrap",
          }}
        >
          [accept]
        </button>
      </div>
    </div>
  );
}
