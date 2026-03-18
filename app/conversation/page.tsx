"use client"

/**
 * /conversation — the [us] app shell
 *
 * FIXES APPLIED (round 4):
 * 1. threadPrompts.ts: settings hasPageView set to false (handled separately)
 * 2. viewMode (permanent fix): replaced single viewMode state with threadViewModes —
 *    a per-thread map. viewMode is derived as threadViewModes[activeThread] ?? "chat"
 *    on every render — cannot be stale or bleed between tabs. switchThread explicitly
 *    clears the destination thread to "chat" before navigating.
 * 3. Input cloned from UnifiedChat exactly: fontSize 20px, var(--font-sans), rounded
 *    bg2 container, borderRadius 13px, padding 9px 13px, amber SVG send button with
 *    rgba(196,151,74,0.14) background, disclaimer at 12px var(--muted) opacity 0.6.
 *    Orb at scale(2) with marginBottom: 80px, anchored at paddingTop: 28vh.
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
// THREAD CHAT VIEW
// key={activeThread} set at call site — full remount on every tab switch
// Input clones UnifiedChat exactly for pixel-identical layout
// ─────────────────────────────────────────────

function ThreadChatView({
  threadType,
  userId,
  isLocked,
  onToggleLock,
}: {
  threadType: ThreadType
  userId: string
  isLocked: boolean
  onToggleLock: () => void
}) {
  const thread = useThread(threadType, userId)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMessagesThread = threadType === "messages"
  const contextPrompt = THREAD_CONTEXT_PROMPTS[threadType] ?? undefined

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = () => {
    const text = inputRef.current?.value.trim()
    if (!text || thread.isStreaming) return
    thread.sendMessage(text)
    if (inputRef.current) {
      inputRef.current.value = ""
      inputRef.current.style.height = "auto"
    }
  }

  const hasConversation = thread.messages.length > 1

  // Input block — cloned from UnifiedChat exactly
  const InputBlock = (
    <div className="no-record" style={{
      padding: "20px 24px 24px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <div style={{ borderTop: "1px solid var(--border)", margin: "0 -18px" }} />
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "13px",
        padding: "9px 13px",
        opacity: thread.isStreaming ? 0.4 : 1,
      }}>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={contextPrompt ?? "[say something…]"}
          aria-label="message [you]"
          className="no-record us-textarea"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = "auto"
            t.style.height = Math.min(t.scrollHeight, 110) + "px"
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "20px",
            fontWeight: 300,
            color: "var(--text)",
            fontFamily: "var(--font-sans)",
            resize: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          className="no-record"
          aria-label="send message"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleSend}
          disabled={thread.isStreaming}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            border: "none",
            background: "rgba(196,151,74,0.14)",
            cursor: thread.isStreaming ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="var(--amber)" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div style={{
        textAlign: "center",
        marginTop: "8px",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        opacity: 0.6,
        lineHeight: 1.5,
      }}>
        by talking to [you], an AI, you agree to our{" "}
        <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>[terms]</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>[privacy policy]</a>
      </div>
    </div>
  )

  // Banner height offset for empty-state absolute positioning
  const bannerHeight = isMessagesThread ? 44 : 0

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      position: "relative",
    }}>
      <style>{`
        .us-textarea:focus-visible {
          outline: 2px solid var(--amber) !important;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>

      {/* DM analysis banner — messages thread only, sits in normal flow */}
      {isMessagesThread && <DMAnalysisBanner />}

      {/* ── Empty state — pinned at 28vh, identical to conversation tab ── */}
      {!hasConversation && (
        <div style={{
          position: "absolute",
          top: `${bannerHeight}px`,
          left: 0,
          right: 0,
          bottom: 0,
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
            padding: "0 24px",
          }}>
            {/* Orb — scale(2), identical to conversation page */}
            <div style={{
              transform: "scale(2)",
              transformOrigin: "center center",
              marginBottom: "80px",
            }}>
              <AmbientOrb
                isRecording={false}
                orbState="idle"
                isLocked={isLocked}
                onToggleLock={onToggleLock}
              />
            </div>

            {/* Opening bubble — matches UnifiedChat message style */}
            {thread.messages[0] && (
              <div style={{
                maxWidth: "520px",
                width: "100%",
                padding: "11px 15px",
                borderRadius: "15px 15px 15px 4px",
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                fontSize: "13.5px",
                fontWeight: 300,
                lineHeight: 1.65,
                color: "var(--text)",
                textAlign: "center",
                marginBottom: "32px",
              }}>
                {thread.messages[0].content}
              </div>
            )}

            {/* Hold prompt — identical to conversation page */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              marginBottom: "32px",
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

            {/* Input — cloned from UnifiedChat */}
            <div style={{ width: "100%" }}>
              {InputBlock}
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
            padding: "24px 24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            scrollbarWidth: "none",
          }}>
            {thread.messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                maxWidth: "70%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  padding: "11px 15px",
                  borderRadius: msg.role === "you" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
                  fontSize: "13.5px",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  color: "var(--text)",
                  background: msg.role === "you" ? "var(--bg2)" : "var(--bg3)",
                  border: `1px solid ${msg.role === "you" ? "var(--border)" : "var(--border2)"}`,
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
          {InputBlock}
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

  // FIX 2: viewMode is derived directly from activeThread on every render.
  // A separate piece of state tracks user's explicit toggle choice,
  // keyed per thread so it can never bleed across tabs.
  const [threadViewModes, setThreadViewModes] = useState<Partial<Record<ThreadType, "chat" | "page">>>({})

  // The effective viewMode for the current thread is always "chat" unless
  // the user has explicitly toggled this specific thread to "page".
  const viewMode: "chat" | "page" = threadViewModes[activeThread] ?? "chat"

  const intake      = useIntake()
  const initialized = useRef(false)

  const hasMessages          = intake.messages.length > 0
  const isConversationThread = activeThread === "conversation"
  const isMessagesThread     = activeThread === "messages"
  const config               = THREAD_CONFIGS[activeThread]

  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  // switchThread: navigate only — viewMode auto-resets because threadViewModes
  // for the new thread defaults to "chat" unless user toggled it previously.
  // We also clear the target thread's viewMode to guarantee chat on arrival.
  const switchThread = (thread: ThreadType) => {
    setThreadViewModes((prev) => ({ ...prev, [thread]: "chat" }))
    router.push(`/conversation?thread=${thread}`)
  }

  const toggleViewMode = () => {
    const next = viewMode === "chat" ? "page" : "chat"
    setThreadViewModes((prev) => ({ ...prev, [activeThread]: next }))
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

  // Lock voice toggle top — below banner on messages thread
  const lockVoiceTop = isMessagesThread
    ? "68px"
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

        {/* ── Top-right toggles — non-conversation threads ── */}
        {!isConversationThread && (
          <>
            {config.hasPageView && (
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
                aria-label={journalShared ? "stop sharing journal" : "share journal with [you]"}
                style={{
                  ...TOGGLE_BUTTON_STYLE,
                  top: journalToggleTop,
                  border: `1px solid ${journalShared ? "var(--amber)" : "var(--border)"}`,
                  color: journalShared ? "var(--amber)" : "var(--muted)",
                }}
              >
                {journalShared ? "[journal: shared]" : "[share journal]"}
              </button>
            )}
          </>
        )}

        {/* Portrait toggle — conversation only */}
        {isConversationThread && (
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

            {/* Empty state — pinned at 28vh */}
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
                  padding: "0 24px",
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
                      onToggleLock={(e) => { e?.stopPropagation(); handleToggleLock() }}
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
