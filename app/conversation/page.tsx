"use client"
/**
 * /conversation — the [us] intake page
 *
 * Wires useIntake hook to existing UnifiedChat + AmbientOrb components.
 * Initializes session on mount with anonymous userId.
 * Handles: recording, text input, rephrase, block state, completion.
 */
import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useIntake } from "@/hooks/useIntake"
import Sidebar from "@/components/sidebar/Sidebar"
import AmbientOrb from "@/components/chat/AmbientOrb"

const UnifiedChat = dynamic(() => import("@/components/chat/UnifiedChat"), { ssr: false })

// ─────────────────────────────────────────────
// ANONYMOUS USER ID
// Generates a stable anonymous ID per device.
// Stored in localStorage — no PII.
// ─────────────────────────────────────────────
function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anon"
  const key = "us_uid"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = `anon_${crypto.randomUUID()}`
  localStorage.setItem(key, id)
  return id
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function ConversationPage() {
  const intake = useIntake()
  const initialized = useRef(false)

  const hasMessages = intake.messages.length > 0
  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  // initialize session once on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const userId = getOrCreateUserId()
    // ensure user row exists before starting session
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .catch(() => {})
      .finally(() => intake.init(userId))
  }, [])

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: "220px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "680px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

          {/* ── error banner ── */}
          {intake.error && (
            <div role="alert" style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 30 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                {intake.error}
              </p>
            </div>
          )}

          {/* ── completion overlay ── */}
          {intake.sessionComplete && (
            <div role="status" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, background: "var(--bg)", opacity: 0.95 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text)", textAlign: "center", padding: "0 32px" }}>
                [your portrait is ready]
              </p>
            </div>
          )}

          {/* ── hero orb — shown before first user message ── */}
          {!hasMessages && (
            <div
              onMouseDown={intake.startRecording}
              onMouseUp={intake.stopRecording}
              onMouseLeave={intake.stopRecording}
              onTouchStart={(e) => { e.preventDefault(); intake.startRecording() }}
              onTouchEnd={intake.stopRecording}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <div style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                <AmbientOrb isRecording={intake.isRecording} orbState={orbState} />
              </div>
            </div>
          )}

          {/* ── unified chat — input always shown; messages appear after first reply ── */}
          <UnifiedChat
            messages={intake.messages}
            isThinking={intake.isThinking}
            isSpeaking={intake.isSpeaking}
            isRecording={intake.isRecording}
            onSendText={intake.sendText}
            onHoldStart={intake.startRecording}
            onHoldEnd={intake.stopRecording}
            onRephrase={intake.requestRephrase}
            disabled={intake.status !== "active"}
            showMessages={hasMessages}
          />
        </div>
      </main>
    </div>
  )
}
