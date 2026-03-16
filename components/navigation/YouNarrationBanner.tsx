"use client"

/**
 * YouNarrationBanner
 *
 * Displays [you]'s narration at the top of each page.
 * Streams in character by character.
 * Dismisses on tap/click or after 8 seconds.
 * Used in every page layout — receives the narration state from useYouNarration.
 */

import { useEffect, useRef } from "react"
import type { NarrationState } from "@/lib/navigation/useYouNarration"

interface Props {
  narration: NarrationState
}

export default function YouNarrationBanner({ narration }: Props) {
  const { message, isStreaming, dismiss } = narration
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // auto-dismiss after 8 seconds once streaming is done
  useEffect(() => {
    if (!isStreaming && message) {
      timerRef.current = setTimeout(dismiss, 8000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isStreaming, message, dismiss])

  if (!message && !isStreaming) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      onClick={dismiss}
      style={{
        width: "100%",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        cursor: "pointer",
        transition: "opacity 0.2s",
      }}
    >
      {/* [you] indicator */}
      <span style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        color: "var(--amber)",
        letterSpacing: "0.05em",
        paddingTop: "1px",
        flexShrink: 0,
        opacity: 0.8,
      }}>
        [you]
      </span>

      {/* message */}
      <span style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
        lineHeight: 1.6,
        flex: 1,
      }}>
        {message}
        {isStreaming && (
          <span style={{
            display: "inline-block",
            width: "6px",
            height: "13px",
            background: "var(--amber)",
            marginLeft: "2px",
            opacity: 0.7,
            animation: "blink 0.8s step-end infinite",
          }} />
        )}
      </span>

      {/* dismiss hint */}
      {!isStreaming && (
        <span style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          flexShrink: 0,
          paddingTop: "2px",
        }}>
          [tap to dismiss]
        </span>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
