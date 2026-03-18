"use client"
/**
 * /conversation — the [us] intake page
 *
 * Wires useIntake hook to existing UnifiedChat + AmbientOrb components.
 * Initializes session on mount with anonymous userId.
 * Handles: recording, text input, rephrase, block state, completion.
 */
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useIntake } from "@/hooks/useIntake"
import Sidebar from "@/components/sidebar/Sidebar"
import AmbientOrb from "@/components/chat/AmbientOrb"

const UnifiedChat = dynamic(() => import("@/components/chat/UnifiedChat"), { ssr: false })

// ─────────────────────────────────────────────
// ANONYMOUS USER ID
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
// ARCHETYPE GRADIENTS
// Placeholder until real portrait artwork exists.
// ─────────────────────────────────────────────
const ARCHETYPE_GRADIENTS: Record<string, { gradient: string; label: string }> = {
  connector:    { gradient: "radial-gradient(ellipse at 60% 40%, rgba(196,151,74,0.28) 0%, rgba(196,151,74,0.04) 60%, transparent 80%)",  label: "connector" },
  seeker:       { gradient: "radial-gradient(ellipse at 40% 60%, rgba(100,140,200,0.28) 0%, rgba(100,140,200,0.04) 60%, transparent 80%)", label: "seeker" },
  nurturer:     { gradient: "radial-gradient(ellipse at 50% 50%, rgba(168,88,96,0.28)  0%, rgba(168,88,96,0.04)  60%, transparent 80%)",  label: "nurturer" },
  visionary:    { gradient: "radial-gradient(ellipse at 70% 30%, rgba(130,100,200,0.28) 0%, rgba(130,100,200,0.04) 60%, transparent 80%)", label: "visionary" },
  architect:    { gradient: "radial-gradient(ellipse at 30% 70%, rgba(80,160,140,0.28)  0%, rgba(80,160,140,0.04)  60%, transparent 80%)",  label: "architect" },
  challenger:   { gradient: "radial-gradient(ellipse at 60% 60%, rgba(200,120,60,0.28)  0%, rgba(200,120,60,0.04)  60%, transparent 80%)",  label: "challenger" },
  default:      { gradient: "radial-gradient(ellipse at 50% 40%, rgba(196,151,74,0.18) 0%, rgba(196,151,74,0.03) 60%, transparent 80%)",  label: "" },
}

function getArchetypeStyle(archetype: string | null) {
  if (!archetype) return ARCHETYPE_GRADIENTS.default
  const key = archetype.toLowerCase()
  return ARCHETYPE_GRADIENTS[key] ?? ARCHETYPE_GRADIENTS.default
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function ConversationPage() {
  const intake = useIntake()
  const initialized = useRef(false)
  const [isLocked, setIsLocked] = useState(false)

  // Portrait background
  const [portraitAsBackground, setPortraitAsBackground] = useState(false)
  const [archetype, setArchetype] = useState<string | null>(null)

  const hasMessages = intake.messages.length > 0
  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  const handleToggleLock = () => {
    setIsLocked((prev) => {
      if (prev && intake.isRecording) intake.stopRecording()
      return !prev
    })
  }

  const handleTap = () => {
    if (isLocked) {
      if (intake.isRecording) intake.stopRecording()
      else intake.startRecording()
    } else {
      intake.startRecording()
    }
  }

  const handleTapEnd = () => {
    if (!isLocked) intake.stopRecording()
  }

  const togglePortraitBg = () => {
    setPortraitAsBackground((prev) => {
      const next = !prev
      localStorage.setItem("us_portrait_bg", String(next))
      return next
    })
  }

  // initialize session + load preferences once on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const userId = getOrCreateUserId()

    // restore portrait bg preference
    setPortraitAsBackground(localStorage.getItem("us_portrait_bg") === "true")

    // ensure user row exists before starting session
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .catch(() => {})
      .finally(() => intake.init(userId))

    // fetch archetype for background gradient
    fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.archetype) setArchetype(data.archetype)
      })
      .catch(() => {})
  }, [])

  const archetypeStyle = getArchetypeStyle(archetype)

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: "var(--sidebar-width)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        alignItems: "center",
        background: "var(--bg)",
        transition: "background 0.4s ease",
      }}>

        {/* Portrait background */}
        {portraitAsBackground && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: archetypeStyle.gradient,
              pointerEvents: "none",
              zIndex: 0,
              transition: "opacity 0.6s ease",
            }}
          />
        )}
        {portraitAsBackground && archetypeStyle.label && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "clamp(80px, 14vw, 160px)",
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              color: "var(--text)",
              opacity: 0.04,
              letterSpacing: "-0.02em",
              pointerEvents: "none",
              userSelect: "none",
              whiteSpace: "nowrap",
              zIndex: 0,
            }}
          >
            {archetypeStyle.label}
          </div>
        )}

        {/* Portrait toggle — top right */}
        <button
          aria-label={portraitAsBackground ? "hide portrait background" : "show portrait background"}
          onClick={togglePortraitBg}
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            zIndex: 20,
            background: "transparent",
            border: "1px solid var(--amber)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--amber)",
            letterSpacing: "0.06em",
            opacity: portraitAsBackground ? 0.9 : 0.45,
            padding: "6px 10px",
            transition: "color 0.15s, opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = portraitAsBackground ? "0.9" : "0.45")}
        >
          {portraitAsBackground ? "[portrait on]" : "[portrait]"}
        </button>

        <div style={{ width: "100%", maxWidth: "1100px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

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

          {/* ── pre-conversation: orb + input centered as a group ── */}
          {!hasMessages && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "56px",
            }}>
              {/* hero orb with hold-to-record */}
              <div
                onMouseDown={handleTap}
                onMouseUp={handleTapEnd}
                onMouseLeave={handleTapEnd}
                onTouchStart={(e) => { e.preventDefault(); handleTap() }}
                onTouchEnd={handleTapEnd}
                style={{ cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}
              >
                <div style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                  <AmbientOrb
                    isRecording={intake.isRecording}
                    orbState={orbState}
                    isLocked={isLocked}
                    onToggleLock={handleToggleLock}
                  />
                </div>
              </div>

              {/* input bar */}
              <div style={{ width: "100%", flexShrink: 0 }}>
                <UnifiedChat
                  messages={intake.messages}
                  isThinking={intake.isThinking}
                  isSpeaking={intake.isSpeaking}
                  isRecording={intake.isRecording}
                  isLocked={isLocked}
                  onSendText={intake.sendText}
                  onHoldStart={handleTap}
                  onHoldEnd={handleTapEnd}
                  onToggleLock={handleToggleLock}
                  onRephrase={intake.requestRephrase}
                  disabled={intake.status !== "active"}
                  showMessages={false}
                />
              </div>
            </div>
          )}

          {/* ── active conversation: full chat ── */}
          {hasMessages && (
            <UnifiedChat
              messages={intake.messages}
              isThinking={intake.isThinking}
              isSpeaking={intake.isSpeaking}
              isRecording={intake.isRecording}
              isLocked={isLocked}
              onSendText={intake.sendText}
              onHoldStart={handleTap}
              onHoldEnd={handleTapEnd}
              onToggleLock={handleToggleLock}
              onRephrase={intake.requestRephrase}
              disabled={intake.status !== "active"}
              showMessages={true}
            />
          )}
        </div>
      </main>
    </div>
  )
}
