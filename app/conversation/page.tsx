"use client"

/**
 * /conversation — the [us] app shell
 *
 * FIXES APPLIED (round 8):
 * 1. Messages orb position: paddingTop is calc(28vh - 44px) on messages thread,
 *    28vh on all others — subtracts banner height so orb lands at same position.
 * 2. Lock voice gap: messages lockVoiceTop increased to 76px (banner 44 + top 16 + gap 16).
 * 3. Settings: always renders SettingsPageView directly. No chat interface, no toggles.
 */

import { useEffect, useRef, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { useIntake } from "@/hooks/useIntake"
import Sidebar from "@/components/sidebar/Sidebar"
import AmbientOrb from "@/components/chat/AmbientOrb"
import ThreadChatView from "@/components/chat/ThreadChatView"
import type { ThreadType } from "@/lib/threads/threadPrompts"
import { THREAD_CONFIGS } from "@/lib/threads/threadPrompts"
import { CONVERSATION_PROMPTS } from "@/lib/threads/conversationPrompts"

const UnifiedChat = dynamic(() => import("@/components/chat/UnifiedChat"), { ssr: false })

const ConnectionsPageView = dynamic(() => import("@/app/connections/PageView"), { ssr: false })
const InsightsPageView    = dynamic(() => import("@/app/insights/PageView"),    { ssr: false })
const JournalPageView     = dynamic(() => import("@/app/journal/PageView"),     { ssr: false })
const AboutPageView       = dynamic(() => import("@/app/about/PageView"),       { ssr: false })
const ProfilePageView     = dynamic(() => import("@/app/profile/PageView"),     { ssr: false })
const SettingsPageView    = dynamic(() => import("@/app/settings/PageView"),    { ssr: false })
const TermsPageView       = dynamic(() => import("@/app/terms/PageView"),       { ssr: false })
const PrivacyPageView     = dynamic(() => import("@/app/privacy/PageView"),     { ssr: false })
const AboutPage           = dynamic(() => import("@/app/about/page"),           { ssr: false })
const NotificationsPageView = dynamic(() => import("@/app/notifications/PageView"), { ssr: false })
const UsPlusPageView        = dynamic(() => import("@/app/us-plus/PageView"),        { ssr: false })

import { useSearchParams } from "next/navigation"
import { useIntentSignal } from "@/hooks/useIntentSignal"
const MatchedConversation = dynamic(() => import("@/components/chat/MatchedConversation"), { ssr: false })

// ─────────────────────────────────────────────
// HELPERS
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

const ARCHETYPE_GRADIENTS: Record<string, string> = {
  rooted:    "radial-gradient(ellipse at 50% 40%, rgba(80,160,100,0.2) 0%, transparent 70%)",
  horizon:   "radial-gradient(ellipse at 60% 40%, rgba(196,151,74,0.2) 0%, transparent 70%)",
  intimate:  "radial-gradient(ellipse at 50% 50%, rgba(168,88,96,0.2) 0%, transparent 70%)",
  current:   "radial-gradient(ellipse at 60% 60%, rgba(200,120,60,0.2) 0%, transparent 70%)",
  liminal:   "radial-gradient(ellipse at 40% 60%, rgba(100,140,200,0.2) 0%, transparent 70%)",
  celestial: "radial-gradient(ellipse at 50% 30%, rgba(130,100,200,0.2) 0%, transparent 70%)",
  composite: "radial-gradient(ellipse at 50% 40%, rgba(196,151,74,0.15) 0%, transparent 70%)",
  default:   "radial-gradient(ellipse at 50% 40%, rgba(196,151,74,0.12) 0%, transparent 70%)",
}

// All top-right toggles — identical size and weight
const TOGGLE_BUTTON_STYLE: React.CSSProperties = {
  position: "absolute",
  right: "20px",
  zIndex: 20,
  background: "transparent",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  padding: "6px 10px",
  minHeight: "44px",
  transition: "border-color 0.15s, color 0.15s",
}

// ─────────────────────────────────────────────
// PAGE VIEW RENDERER
// ─────────────────────────────────────────────

function PageViewRenderer({ threadType }: { threadType: ThreadType }) {
  switch (threadType) {
    case "connections": return <ConnectionsPageView />
    case "insights":    return <InsightsPageView />
    case "journal":     return <JournalPageView />
    case "about":       return <AboutPageView />
    case "profile":     return <ProfilePageView />
    case "settings":       return <SettingsPageView />
    case "notifications":  return <NotificationsPageView />
    case "us-plus":        return <UsPlusPageView />
    case "terms":          return <TermsPageView />
    case "privacy":     return <PrivacyPageView />
    default:            return null
  }
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

function ConversationPage() {
  // Tab state is pure local state — no URL params, no router.
  // Eliminates the Next.js App Router searchParams re-render race entirely.
  const [activeThread, setActiveThread] = useState<ThreadType>("conversation")
  const [viewMode, setViewMode]         = useState<"chat" | "page">("chat")

  const [userId, setUserId]                             = useState<string | null>(null)
  const [isLocked, setIsLocked]                         = useState(false)
  const [portraitAsBackground, setPortraitAsBackground] = useState(false)
  const [archetype, setArchetype]                       = useState<string | null>(null)
  const [journalShared, setJournalShared]               = useState(false)
  const [journalHovered, setJournalHovered]             = useState(false)
  const [openingBubble, setOpeningBubble] = useState(
    () => CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)]
  )

  const searchParams = useSearchParams()
  const matchedConversationId = searchParams.get("c")

  const intentSignal = useIntentSignal(userId, activeThread === "connections")

  const intake      = useIntake()
  const initialized = useRef(false)

  const hasMessages          = intake.messages.some((m) => m.role === "user")
  const isConversationThread = activeThread === "conversation"
  const isMessagesThread     = activeThread === "messages"
  const config               = THREAD_CONFIGS[activeThread]

  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  // Both state updates are synchronous in the same handler — React batches
  // them into one render. viewMode is always "chat" when new thread renders.
  const switchThread = (thread: ThreadType) => {
    setViewMode("chat")
    setActiveThread(thread)
  }

  const toggleViewMode = () => {
    setViewMode((prev) => prev === "chat" ? "page" : "chat")
  }

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

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const uid = getOrCreateUserId()
    setUserId(uid)
    setPortraitAsBackground(localStorage.getItem("us_portrait_bg") === "true")

    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid }),
    })
      .catch(() => {})
      .finally(() => intake.init(uid))

    fetch(`/api/profile?userId=${encodeURIComponent(uid)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.archetype) setArchetype(data.archetype) })
      .catch(() => {})
  }, [])

  const gradient = ARCHETYPE_GRADIENTS[archetype?.toLowerCase() ?? ""] ?? ARCHETYPE_GRADIENTS.default

  const [typedBubble, setTypedBubble] = useState("")
  const [bubbleDone, setBubbleDone] = useState(false)
  const bubbleIndexRef = useRef(0)

  useEffect(() => {
    bubbleIndexRef.current = 0
    setTypedBubble("")
    setBubbleDone(false)
    const interval = setInterval(() => {
      if (bubbleIndexRef.current >= openingBubble.length) {
        setBubbleDone(true)
        clearInterval(interval)
        return
      }
      setTypedBubble(openingBubble.slice(0, bubbleIndexRef.current + 1))
      bubbleIndexRef.current += 1
    }, 18)
    return () => clearInterval(interval)
  }, [openingBubble])

  useEffect(() => {
    if (!bubbleDone) return
    const timeout = setTimeout(() => {
      setOpeningBubble(
        CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)]
      )
    }, 3000)
    return () => clearTimeout(timeout)
  }, [bubbleDone])

  // Lock voice toggle top — below banner on messages thread
  // Banner is ~44px tall + 16px top margin = 60px, plus 16px gap = 76px
  const lockVoiceTop = isMessagesThread
    ? "60px"
    : activeThread === "about"
    ? "16px"
    : config.hasPageView ? "72px" : "16px"
  const journalToggleTop = config.hasPageView ? "128px" : "72px"

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar activeThread={activeThread} onThreadSelect={switchThread} intentSignal={intentSignal} />

      <main
        onMouseDown={isConversationThread ? handleTap : undefined}
        onMouseUp={isConversationThread ? handleTapEnd : undefined}
        onMouseLeave={isConversationThread ? handleTapEnd : undefined}
        onTouchStart={isConversationThread ? (e) => { e.preventDefault(); handleTap() } : undefined}
        onTouchEnd={isConversationThread ? handleTapEnd : undefined}
        style={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          marginLeft: "var(--sidebar-width)",
          width: "calc(100vw - var(--sidebar-width))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          alignItems: "center",
          background: "var(--bg)",
          cursor: isConversationThread ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        {/* Portrait background */}
        {portraitAsBackground && isConversationThread && (
          <div aria-hidden="true" style={{
            position: "absolute",
            inset: 0,
            background: gradient,
            pointerEvents: "none",
            zIndex: 0,
          }} />
        )}

        {/* ── Top-right toggles — non-conversation threads (not settings/us-plus/notifications) ── */}
        {!isConversationThread && activeThread !== "settings" && activeThread !== "us-plus" && activeThread !== "notifications" && (activeThread as string) !== "about" && (
          <>
            {config.hasPageView && (activeThread as string) !== "about" && (
              <button
                onClick={toggleViewMode}
                aria-label={viewMode === "chat" ? "switch to page view" : "switch to chat view"}
                style={{
                  ...TOGGLE_BUTTON_STYLE,
                  top: "16px",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                {viewMode === "chat" ? "[page view]" : "[chat view]"}
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); handleToggleLock() }}
              aria-label={isLocked ? "unlock voice" : "lock voice"}
              style={{
                ...TOGGLE_BUTTON_STYLE,
                top: lockVoiceTop,
                border: `1px solid ${isLocked ? "var(--amber)" : "var(--border)"}`,
                color: isLocked ? "var(--amber)" : "var(--muted)",
              }}
            >
              {isLocked ? "[voice locked]" : "[lock voice]"}
            </button>

            {activeThread === "journal" && (
              <button
                onClick={(e) => { e.stopPropagation(); setJournalShared((p) => !p) }}
                onMouseEnter={() => setJournalHovered(true)}
                onMouseLeave={() => setJournalHovered(false)}
                aria-label={journalShared ? "stop sharing journal" : "share journal with [u]"}
                style={{
                  ...TOGGLE_BUTTON_STYLE,
                  top: journalToggleTop,
                  border: `1px solid ${journalShared ? "var(--amber)" : "var(--border)"}`,
                  color: journalShared ? "var(--amber)" : "var(--muted)",
                }}
              >
                {journalShared ? "[journal: shared]" : journalHovered ? "[share journal]" : "[witness mode]"}
              </button>
            )}
          </>
        )}

        {/* Portrait + lock voice toggles — conversation only */}
        {isConversationThread && (
          <>
            <button
              aria-label={portraitAsBackground ? "hide portrait" : "show portrait"}
              onClick={(e) => {
                e.stopPropagation()
                const next = !portraitAsBackground
                setPortraitAsBackground(next)
                localStorage.setItem("us_portrait_bg", String(next))
              }}
              style={{
                ...TOGGLE_BUTTON_STYLE,
                top: "16px",
                border: "1px solid var(--amber)",
                color: "var(--amber)",
                opacity: portraitAsBackground ? 0.9 : 0.45,
              }}
            >
              {portraitAsBackground ? "[portrait on]" : "[portrait]"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleLock() }}
              aria-label={isLocked ? "unlock voice" : "lock voice"}
              style={{
                ...TOGGLE_BUTTON_STYLE,
                top: "72px",
                border: `1px solid ${isLocked ? "var(--amber)" : "var(--border)"}`,
                color: isLocked ? "var(--amber)" : "var(--muted)",
              }}
            >
              {isLocked ? "[voice locked]" : "[lock voice]"}
            </button>
          </>
        )}

        {/* ── CONVERSATION THREAD ── */}
        {isConversationThread && matchedConversationId ? (
          <div style={{
            width: "100%", flex: 1,
            display: "flex", flexDirection: "column",
            overflow: "hidden", position: "relative", zIndex: 1,
          }}>
            <MatchedConversation
              conversationId={matchedConversationId}
              userId={userId ?? "anon"}
              firstPrompt={null}
            />
          </div>
        ) : isConversationThread && (
          <div style={{
            width: "100%",
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}>
            {intake.error && (
              <div role="alert" style={{
                position: "absolute", top: 12, left: 0, right: 0,
                display: "flex", justifyContent: "center", zIndex: 30,
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                  {intake.error}
                </p>
              </div>
            )}

            {intake.sessionComplete && (
              <div role="status" style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 30, background: "var(--bg)", opacity: 0.95,
              }}>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px",
                  color: "var(--text)", textAlign: "center", padding: "0 32px",
                }}>
                  [your portrait is ready]
                </p>
              </div>
            )}

            {/* Empty state — fixed, centers in content area */}
            {!hasMessages && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: "var(--sidebar-width)",
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{ pointerEvents: "auto" }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
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
                    placeholder="conversing with [u] is you doing the work. it starts with [u]. it proceeds with [us]."
                    inputRows={2}
                  />
                </div>
              </div>
            )}

            {hasMessages && (
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
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
                  placeholder="conversing with [u] is you doing the work. it starts with [u]. it proceeds with [us]."
                      inputRows={2}
                />
              </div>
            )}
          </div>
        )}

        {/* ── OTHER THREADS ── */}
        {!isConversationThread && userId && (
          <div style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}>
            {/* Settings always shows SettingsPageView — no chat interface */}
            {activeThread === "settings" ? (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <Suspense fallback={
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "100%", fontFamily: "var(--font-mono)",
                    fontSize: "12px", color: "var(--dim)",
                  }}>
                    [loading...]
                  </div>
                }>
                  <SettingsPageView />
                </Suspense>
              </div>
            ) : activeThread === "about" ? (
              <AboutPage embedded />
            ) : activeThread === "notifications" ? (
              <NotificationsPageView />
            ) : activeThread === "us-plus" ? (
              <UsPlusPageView />
            ) : viewMode === "chat" ? (
              <ThreadChatView
                key={activeThread}
                threadType={activeThread}
                userId={userId}
                isLocked={isLocked}
                onToggleLock={handleToggleLock}
              />
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <Suspense fallback={
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "100%", fontFamily: "var(--font-mono)",
                    fontSize: "12px", color: "var(--dim)",
                  }}>
                    [loading...]
                  </div>
                }>
                  <PageViewRenderer threadType={activeThread} />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ConversationPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ConversationPage />
    </Suspense>
  )
}
