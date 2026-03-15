"use client"
/**
 * /conversation — the [us] intake page
 *
 * Wires useIntake hook to existing UnifiedChat + AmbientOrb components.
 * Initializes session on mount with anonymous userId.
 * Handles: recording, text input, rephrase, block state, completion.
 */
import { useEffect, useRef } from "react"
import { useIntake } from "@/hooks/useIntake"
import AmbientOrb from "@/components/chat/AmbientOrb"
import UnifiedChat from "@/components/chat/UnifiedChat"

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

  // initialize session once on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const userId = getOrCreateUserId()
    intake.init(userId)
  }, [])

  return (
    <main className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* ── ambient orb ── */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AmbientOrb
          orbState={intake.orbState}
          isRecording={intake.isRecording}
          onHoldStart={intake.startRecording}
          onHoldEnd={intake.stopRecording}
        />
      </div>

      {/* ── rephrase options ── */}
      {intake.rephrases && (
        <div className="absolute bottom-48 left-0 right-0 flex flex-col items-center gap-2 px-6 z-20">
          {intake.rephrases.map((r, i) => (
            <button
              key={i}
              onClick={() => intake.selectRephrase(r)}
              className="text-[var(--color-text-muted)] text-sm font-mono hover:text-[var(--color-text)] transition-colors text-center max-w-sm"
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => intake.selectRephrase(intake.messages.filter(m => m.role === "them").slice(-1)[0]?.content ?? "")}
            className="text-[var(--color-text-dim)] text-xs font-mono mt-1"
          >
            [keep original]
          </button>
        </div>
      )}

      {/* ── completion state ── */}
      {intake.sessionComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-[var(--color-bg)] bg-opacity-90">
          <p className="text-[var(--color-text)] font-mono text-sm text-center px-8">
            [your portrait is ready]
          </p>
        </div>
      )}

      {/* ── error state ── */}
      {intake.error && (
        <div className="absolute top-6 left-0 right-0 flex justify-center z-30">
          <p className="text-[var(--color-text-muted)] font-mono text-xs">
            {intake.error}
          </p>
        </div>
      )}

      {/* ── unified chat interface ── */}
      <div className="w-full">
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
        />
      </div>
    </main>
  )
}
