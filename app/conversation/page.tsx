"use client"

/**
 * /conversation — the [us] app shell
 *
 * FIXES APPLIED (round 3):
 * 1. Toggle colors — lock voice and share journal same color/opacity as page view
 * 2. Messages banner — lock voice positioned below the DM analysis banner, not over it
 * 3. viewMode + stale content — ThreadChatView gets key={activeThread} so React
 *    fully unmounts/remounts on tab switch. Eliminates stale bubble content and
 *    viewMode flash in one shot.
 * 4. Layout pinned — orb/bubble/hints/chatbox use absolute positioning anchored
 *    to a fixed vertical center point, so position never shifts between threads
 *    regardless of bubble text length.
 */

import { useEffect, useRef, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { useSearchParams, useRouter } from "next/navigation"
import { useIntake } from "@/hooks/useIntake"
import { useThread } from "@/hooks/useThread"
import Sidebar from "@/components/sidebar/Sidebar"
import AmbientOrb from "@/components/chat/AmbientOrb"
import DMAnalysisBanner from "@/components/chat/DMAnalysisBanner"
import type { ThreadType } from "@/lib/threads/threadPrompts"
import { THREAD_CONFIGS } from "@/lib/threads/threadPrompts"
import { CONVERSATION_PROMPTS, THREAD_CONTEXT_PROMPTS } from "@/lib/threads/conversationPrompts"

const UnifiedChat = dynamic(() => import("@/components/chat/UnifiedChat"), { ssr: false })

const ConnectionsPageView = dynamic(() => import("@/app/connections/PageView"), { ssr: false })
const InsightsPageView    = dynamic(() => import("@/app/insights/PageView"),    { ssr: false })
const JournalPageView     = dynamic(() => import("@/app/journal/PageView"),     { ssr: false })
const AboutPageView       = dynamic(() => import("@/app/about/PageView"),       { ssr: false })
const ProfilePageView     = dynamic(() => import("@/app/profile/PageView"),     { ssr: false })
const SettingsPageView    = dynamic(() => import("@/app/settings/PageView"),    { ssr: false })
const TermsPageView       = dynamic(() => import("@/app/terms/PageView"),       { ssr: false })
const PrivacyPageView     = dynamic(() => import("@/app/privacy/PageView"),     { ssr: false })

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

// FIX 1: All toggles use identical color/opacity — no dim inactive state
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
// THREAD CHAT VIEW
// FIX 3: key={activeThread} is set at the call site — this component
// fully remounts on every tab switch, eliminating stale content.
// FIX 4: layout uses a fixed vertical anchor so position never shifts.
// ─────────────────────────────────────────────

function ThreadChatView({
  threadType,
  userId,
  isLocked,
  onToggleLock,
  hasBanner,
}: {
  threadType: ThreadType
  userId: string
  isLocked: boolean
  onToggleLock: () => void
  hasBanner?: boolean // true for messages thread (DM analysis banner present)
}) {
  const thread = useThread(threadType, userId)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextPrompt = THREAD_CONTEXT_PROMPTS[threadType] ?? undefined

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = () => {
    if (!input.trim()) return
    thread.sendMessage(input.trim())
    setInput("")
  }

  const hasConversation = thread.messages.length > 1

  // FIX 2 (layout): when banner is shown, empty-state absolute div starts below it
  const bannerHeight = hasBanner ? 44 : 0
  const emptyStateTop = `${bannerHeight}px`

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      position: "relative",
    }}>

      {/* DM analysis banner — messages thread only, sits in normal flow at top */}
      {hasBanner && <DMAnalysisBanner />}

      {/* ── FIX 4: Empty state with pinned layout ── */}
      {!hasConversation && (
        // Outer: absolute below any banner, aligns inner stack to 28vh from its top
        <div style={{
          position: "absolute",
          top: emptyStateTop,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "28vh", // fixed anchor — same on every thread
        }}>
          {/* Inner stack: orb → bubble → hints → chatbox, fixed gaps */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "860px",
            padding: "0 40px",
          }}>

            {/* Orb — scale(2) matching conversation page */}
            <div style={{
              transform: "scale(2)",
              transformOrigin: "center center",
              marginBottom: "80px", // fixed gap regardless of bubble text
            }}>
              <AmbientOrb
                isRecording={false}
                orbState="idle"
                isLocked={isLocked}
                onToggleLock={onToggleLock}
              />
            </div>

            {/* Opening bubble */}
            {thread.messages[0] && (
              <div style={{
                maxWidth: "520px",
                width: "100%",
                padding: "14px 20px",
                borderRadius: "16px 16px 16px 4px",
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                color: "var(--text)",
                fontWeight: 300,
                lineHeight: 1.7,
                textAlign: "center",
                marginBottom: "32px", // fixed gap
              }}>
                {thread.messages[0].content}
              </div>
            )}

            {/* Hold prompt */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              marginBottom: "32px", // fixed gap
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--muted)",
                letterSpacing: "0.06em",
              }}>
                hold anywhere to speak
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--muted)",
                letterSpacing: "0.06em",
              }}>
                or type below
              </span>
            </div>

            {/* Chatbox */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={contextPrompt ?? "[say something...]"}
                  aria-label="message [you]"
                  rows={1}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    color: "var(--text)",
                    fontWeight: 300,
                    lineHeight: 1.5,
                    resize: "none",
                    minHeight: "44px",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || thread.isStreaming}
                  aria-label="send message"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: input.trim() ? "var(--amber)" : "var(--bg3)",
                    border: "none",
                    cursor: input.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={input.trim() ? "var(--bg)" : "var(--dim)"}
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--dim)",
                textAlign: "center",
                opacity: 0.7,
              }}>
                by talking to [you], an AI, you agree to our{" "}
                <a href="/terms" style={{ color: "var(--muted)", textDecoration: "underline" }}>[terms]</a>
                {" "}and{" "}
                <a href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline" }}>[privacy policy]</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active conversation ── */}
      {hasConversation && (
        <>
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 40px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            {thread.messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "72%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "var(--bg3)" : "var(--bg2)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                  {msg.role === "you" && thread.isStreaming && !msg.content && (
                    <span style={{
                      display: "inline-block",
                      width: "7px",
                      height: "14px",
                      background: "var(--amber)",
                      opacity: 0.7,
                      animation: "blink 0.8s step-end infinite",
                      verticalAlign: "text-bottom",
                      marginLeft: "2px",
                    }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: "16px 40px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={contextPrompt ?? "[say something...]"}
                aria-label="message [you]"
                rows={1}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.5,
                  resize: "none",
                  minHeight: "44px",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || thread.isStreaming}
                aria-label="send message"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: input.trim() ? "var(--amber)" : "var(--bg3)",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() ? "var(--bg)" : "var(--dim)"}
                  strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              textAlign: "center",
              opacity: 0.7,
            }}>
              by talking to [you], an AI, you agree to our{" "}
              <a href="/terms" style={{ color: "var(--muted)", textDecoration: "underline" }}>[terms]</a>
              {" "}and{" "}
              <a href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline" }}>[privacy policy]</a>
            </div>
          </div>
        </>
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
    case "settings":    return <SettingsPageView />
    case "terms":       return <TermsPageView />
    case "privacy":     return <PrivacyPageView />
    default:            return null
  }
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function ConversationPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeThread = (searchParams.get("thread") ?? "conversation") as ThreadType

  const [userId, setUserId]                             = useState<string | null>(null)
  const [isLocked, setIsLocked]                         = useState(false)
  const [portraitAsBackground, setPortraitAsBackground] = useState(false)
  const [archetype, setArchetype]                       = useState<string | null>(null)
  const [journalShared, setJournalShared]               = useState(false)
  const [placeholder, setPlaceholder]                   = useState(CONVERSATION_PROMPTS[0])

  // viewMode: ref for synchronous reads, state for rendering
  const viewModeRef = useRef<"chat" | "page">("chat")
  const [viewMode, setViewModeState] = useState<"chat" | "page">("chat")
  const setViewMode = (mode: "chat" | "page") => {
    viewModeRef.current = mode
    setViewModeState(mode)
  }

  const intake      = useIntake()
  const initialized = useRef(false)

  const hasMessages          = intake.messages.length > 0
  const isConversationThread = activeThread === "conversation"
  const config               = THREAD_CONFIGS[activeThread]
  const isMessagesThread     = activeThread === "messages"

  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  // Reset viewMode synchronously on tab switch — before navigation fires
  const switchThread = (thread: ThreadType) => {
    viewModeRef.current = "chat"
    setViewModeState("chat")
    router.push(`/conversation?thread=${thread}`)
  }

  // Safety net for back/forward nav
  useEffect(() => {
    viewModeRef.current = "chat"
    setViewModeState("chat")
  }, [activeThread])

  const toggleViewMode = () => {
    const next = viewModeRef.current === "chat" ? "page" : "chat"
    setViewMode(next)
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

  // Shuffle conversation placeholder every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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

  // FIX 2: Calculate top offset for lock voice toggle on messages thread.
  // The DM analysis banner is ~44px tall. Lock voice sits below it with 12px gap.
  const lockVoiceTop = isMessagesThread
    ? "68px"  // below banner (44px) + gap (12px) + 12px top margin
    : config.hasPageView ? "72px" : "16px"

  const journalToggleTop = config.hasPageView ? "128px" : "72px"

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar activeThread={activeThread} onThreadSelect={switchThread} />

      <main
        onMouseDown={isConversationThread ? handleTap : undefined}
        onMouseUp={isConversationThread ? handleTapEnd : undefined}
        onMouseLeave={isConversationThread ? handleTapEnd : undefined}
        onTouchStart={isConversationThread ? (e) => { e.preventDefault(); handleTap() } : undefined}
        onTouchEnd={isConversationThread ? handleTapEnd : undefined}
        style={{
          flex: 1,
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

        {/* ── Top-right toggles for non-conversation threads ── */}
        {!isConversationThread && (
          <>
            {/* [page view] toggle */}
            {config.hasPageView && (
              <button
                onClick={toggleViewMode}
                aria-label={viewMode === "chat" ? "switch to page view" : "switch to chat view"}
                style={{
                  ...TOGGLE_BUTTON_STYLE,
                  top: "16px",
                  // FIX 1: same border/color as all other toggles
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                {viewMode === "chat" ? "[page view]" : "[chat view]"}
              </button>
            )}

            {/* FIX 1 + FIX 2: [lock voice] — same color as page view, positioned below banner on messages */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleLock()
              }}
              aria-label={isLocked ? "unlock voice" : "lock voice"}
              style={{
                ...TOGGLE_BUTTON_STYLE,
                top: lockVoiceTop,
                // FIX 1: match page view color when inactive; amber only when active
                border: `1px solid ${isLocked ? "var(--amber)" : "var(--border)"}`,
                color: isLocked ? "var(--amber)" : "var(--muted)",
              }}
            >
              {isLocked ? "[voice locked]" : "[lock voice]"}
            </button>

            {/* Journal share toggle */}
            {activeThread === "journal" && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setJournalShared((prev) => !prev)
                }}
                aria-label={journalShared ? "stop sharing journal with [you]" : "share journal with [you]"}
                style={{
                  ...TOGGLE_BUTTON_STYLE,
                  top: journalToggleTop,
                  // FIX 1: match page view color when inactive
                  border: `1px solid ${journalShared ? "var(--amber)" : "var(--border)"}`,
                  color: journalShared ? "var(--amber)" : "var(--muted)",
                }}
              >
                {journalShared ? "[journal: shared]" : "[share journal]"}
              </button>
            )}
          </>
        )}

        {/* Portrait toggle — conversation thread only */}
        {isConversationThread && (
          <button
            aria-label={portraitAsBackground ? "hide portrait background" : "show portrait background"}
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
        )}

        {/* ── CONVERSATION THREAD ── */}
        {isConversationThread && (
          <div style={{
            width: "100%",
            maxWidth: "1100px",
            flex: 1,
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

            {/* FIX 4: conversation page also uses paddingTop anchor for consistency */}
            {!hasMessages && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "28vh",
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: "1100px",
                  padding: "0 40px",
                }}>
                  <div style={{
                    transform: "scale(2)",
                    transformOrigin: "center center",
                    marginBottom: "80px",
                  }}>
                    <AmbientOrb
                      isRecording={intake.isRecording}
                      orbState={orbState}
                      isLocked={isLocked}
                      onToggleLock={(e) => {
                        e?.stopPropagation()
                        handleToggleLock()
                      }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "32px",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "12px",
                      color: "var(--muted)", letterSpacing: "0.06em",
                    }}>
                      hold anywhere to speak
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "12px",
                      color: "var(--muted)", letterSpacing: "0.06em",
                    }}>
                      or type below
                    </span>
                  </div>

                  <div
                    style={{ width: "100%", flexShrink: 0 }}
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
                      placeholder={placeholder}
                    />
                  </div>
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
                  placeholder={placeholder}
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
            {viewMode === "chat" ? (
              // FIX 3: key={activeThread} forces full remount on tab switch.
              // Eliminates stale bubble content AND viewMode flash simultaneously.
              <ThreadChatView
                key={activeThread}
                threadType={activeThread}
                userId={userId}
                isLocked={isLocked}
                onToggleLock={handleToggleLock}
                hasBanner={isMessagesThread}
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
