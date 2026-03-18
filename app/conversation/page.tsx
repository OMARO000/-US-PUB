"use client"

/**
 * /conversation — the [us] app shell
 *
 * FIXES APPLIED (round 2):
 * 1. Journal tab: remove "[you] cannot see your journal" bar.
 *    Replace with a "[share journal with [you]]" toggle in the top-right,
 *    positioned below [lock voice] toggle with gap.
 * 2. viewMode bug: eliminated useEffect reset (fires after render = flash).
 *    viewMode is now a ref, not state. Render reads ref.current directly.
 *    switchThread sets ref synchronously before navigation. No flash possible.
 * 3. All thread chat views show "hold anywhere to speak" + "or type below"
 *    exactly as on conversation page — both lines, same color (var(--muted)).
 * 4. [lock voice] toggle on every chat view, below [page view] with gap.
 * 5. Chatbox positioned directly under hint text — same layout as conversation page.
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

// Shared toggle button style
const TOGGLE_BTN: React.CSSProperties = {
  background: "transparent",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  padding: "6px 10px",
  minHeight: "44px",
  transition: "border-color 0.15s, color 0.15s, opacity 0.15s",
  whiteSpace: "nowrap",
}

// ─────────────────────────────────────────────
// JOURNAL SHARE TOGGLE
// FIX 1: Replaces "[you] cannot see your journal" bar.
// Rendered as a toggle in the top-right stack.
// ─────────────────────────────────────────────

function JournalShareToggle() {
  const [shared, setShared] = useState(false)
  return (
    <button
      onClick={() => setShared((s) => !s)}
      aria-label={shared ? "stop sharing journal with [you]" : "share journal with [you]"}
      style={{
        ...TOGGLE_BTN,
        border: `1px solid ${shared ? "var(--amber)" : "var(--border)"}`,
        color: shared ? "var(--amber)" : "var(--muted)",
        opacity: shared ? 0.9 : 0.55,
      }}
    >
      {shared ? "[journal shared]" : "[share journal with [you]]"}
    </button>
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
// CHAT INPUT — shared between empty and active state
// FIX 5: Chatbox positioned directly under hint text
// ─────────────────────────────────────────────

function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  isStreaming: boolean
  placeholder?: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={placeholder ?? "[say something...]"}
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
          onClick={onSend}
          disabled={!value.trim() || isStreaming}
          aria-label="send message"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: value.trim() ? "var(--amber)" : "var(--bg3)",
            border: "none",
            cursor: value.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={value.trim() ? "var(--bg)" : "var(--dim)"}
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
  )
}

// ─────────────────────────────────────────────
// THREAD CHAT VIEW
// Layout: orb → hint text → chatbox (mirrors conversation page exactly)
// FIX 3: Both hint lines on all threads
// FIX 5: Chatbox directly under hints
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
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMessages = threadType === "messages"
  const contextPrompt = THREAD_CONTEXT_PROMPTS[threadType] ?? undefined

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = () => {
    if (!input.trim()) return
    thread.sendMessage(input.trim())
    setInput("")
  }

  // hasConversation = user has replied at least once
  const hasConversation = thread.messages.length > 1

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      overflow: "hidden",
    }}>

      {/* DM analysis banner — messages thread only, full width */}
      {isMessages && <DMAnalysisBanner />}

      {/* Centered content column */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        maxWidth: "860px",
        width: "100%",
        margin: "0 auto",
        overflow: "hidden",
      }}>

        {/* ── Empty state: mirrors conversation page layout exactly ── */}
        {!hasConversation && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
            padding: "80px 40px 40px", // top padding clears the toggle buttons
          }}>
            {/* Orb */}
            <div style={{ transform: "scale(1.4)", transformOrigin: "center center" }}>
              <AmbientOrb
                isRecording={false}
                orbState="idle"
                isLocked={isLocked}
                onToggleLock={onToggleLock}
              />
            </div>

            {/* Opening bubble (single, no duplicate) */}
            {thread.messages[0] && (
              <div style={{
                maxWidth: "520px",
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
              }}>
                {thread.messages[0].content}
              </div>
            )}

            {/* FIX 3: Both hint lines, var(--muted), same as conversation page */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                hold anywhere to speak
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                or type below
              </span>
            </div>

            {/* FIX 5: Chatbox directly below hint text */}
            <div style={{ width: "100%" }}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isStreaming={thread.isStreaming}
                placeholder={contextPrompt}
              />
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
            <div style={{ padding: "16px 40px 24px", borderTop: "1px solid var(--border)" }}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isStreaming={thread.isStreaming}
                placeholder={contextPrompt}
              />
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
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function ConversationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeThread = (searchParams.get("thread") ?? "conversation") as ThreadType

  const [userId, setUserId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [portraitAsBackground, setPortraitAsBackground] = useState(false)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState(CONVERSATION_PROMPTS[0])

  // FIX 2: viewMode is a ref — setting it is synchronous with zero re-render latency.
  // We use a forceRender counter only when the user explicitly clicks a toggle.
  // switchThread sets the ref to "chat" BEFORE pushing the new route, so by the
  // time the new thread renders, viewMode is already "chat" — no flash, no race.
  const viewModeRef = useRef<"chat" | "page">("chat")
  const [, forceRender] = useState(0)
  const viewMode = viewModeRef.current

  const intake = useIntake()
  const initialized = useRef(false)

  const hasMessages = intake.messages.length > 0
  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  const isConversationThread = activeThread === "conversation"
  const config = THREAD_CONFIGS[activeThread]

  const switchThread = (thread: ThreadType) => {
    viewModeRef.current = "chat" // synchronous — guaranteed before render
    router.push(`/conversation?thread=${thread}`)
  }

  const toggleViewMode = () => {
    viewModeRef.current = viewModeRef.current === "chat" ? "page" : "chat"
    forceRender((n) => n + 1)
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

  // shuffle conversation placeholder every 3s
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

        {/* ── TOP-RIGHT TOGGLE STACK (non-conversation threads) ── */}
        {!isConversationThread && (
          <div style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "flex-end",
          }}>
            {/* [page view] / [chat view] */}
            {config.hasPageView && (
              <button
                onClick={toggleViewMode}
                aria-label={viewMode === "chat" ? "switch to page view" : "switch to chat view"}
                style={{
                  ...TOGGLE_BTN,
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                {viewMode === "chat" ? "[page view]" : "[chat view]"}
              </button>
            )}

            {/* FIX 4: [lock voice] on every chat view */}
            {viewMode === "chat" && (
              <button
                onClick={handleToggleLock}
                aria-label={isLocked ? "unlock voice" : "lock voice"}
                style={{
                  ...TOGGLE_BTN,
                  border: `1px solid ${isLocked ? "var(--amber)" : "var(--border)"}`,
                  color: isLocked ? "var(--amber)" : "var(--muted)",
                  opacity: isLocked ? 0.9 : 0.55,
                }}
              >
                {isLocked ? "[voice locked]" : "[lock voice]"}
              </button>
            )}

            {/* FIX 1: Journal share toggle */}
            {activeThread === "journal" && viewMode === "chat" && (
              <JournalShareToggle />
            )}
          </div>
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
              position: "absolute",
              top: "16px",
              right: "20px",
              zIndex: 20,
              ...TOGGLE_BTN,
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
              <div role="alert" style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 30 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                  {intake.error}
                </p>
              </div>
            )}

            {intake.sessionComplete && (
              <div role="status" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, background: "var(--bg)", opacity: 0.95 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text)", textAlign: "center", padding: "0 32px" }}>
                  [your portrait is ready]
                </p>
              </div>
            )}

            {!hasMessages && (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "56px",
              }}>
                <div style={{ transform: "scale(2)", transformOrigin: "center center" }}>
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

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                    hold anywhere to speak
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.06em" }}>
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
            )}

            {hasMessages && (
              <div
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
                threadType={activeThread}
                userId={userId}
                isLocked={isLocked}
                onToggleLock={handleToggleLock}
              />
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <Suspense fallback={
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--dim)",
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
