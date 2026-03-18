"use client"

/**
 * /waiting — ambient post-action waiting state
 *
 * Two modes via ?state= param:
 *   portrait — just finished intake, matches being found
 *   pending  — connected with someone, waiting for mutual
 */

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function WaitingContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get("state") ?? "portrait"
  const [dot, setDot] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setDot((p) => (p + 1) % 4), 600)
    return () => clearInterval(interval)
  }, [])

  const dots = ".".repeat(dot)

  const isPortrait = state === "portrait"

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      gap: "0",
    }}>
      {/* ambient orb placeholder */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, rgba(196,151,74,0.35) 0%, rgba(196,151,74,0.08) 60%, transparent 100%)",
        border: "1px solid rgba(196,151,74,0.2)",
        marginBottom: "40px",
        animation: "breathe 3s ease-in-out infinite",
      }} />

      {/* primary message */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "14px",
        fontWeight: 300,
        color: "var(--text)",
        textAlign: "center",
        lineHeight: 1.7,
        maxWidth: "300px",
        marginBottom: "16px",
      }}>
        {isPortrait
          ? `[them] is finding your matches${dots}`
          : `waiting for something to open${dots}`}
      </div>

      {/* secondary message */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        fontWeight: 300,
        color: "var(--muted)",
        textAlign: "center",
        lineHeight: 1.7,
        maxWidth: "260px",
        marginBottom: "48px",
        opacity: 0.6,
      }}>
        {isPortrait
          ? "this takes a moment. you don't need to stay on this page."
          : "when the other person is ready, it will open on its own."}
      </div>

      {/* nav links */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}>
        {isPortrait ? (
          <>
            <a href="/connections" style={linkStyle}>
              [check connections]
            </a>
            <a href="/conversation" style={{ ...linkStyle, opacity: 0.4 }}>
              [back to [them]]
            </a>
          </>
        ) : (
          <>
            <a href="/connections" style={linkStyle}>
              [see all connections]
            </a>
            <a href="/conversation" style={{ ...linkStyle, opacity: 0.4 }}>
              [talk to [them]]
            </a>
          </>
        )}
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function WaitingPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>
          [loading...]
        </span>
      </div>
    }>
      <WaitingContent />
    </Suspense>
  )
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "var(--amber)",
  textDecoration: "none",
  letterSpacing: "0.04em",
  transition: "opacity 0.15s",
}
