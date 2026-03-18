"use client"

/**
 * /conversation — the [us] app shell
 *
 * The entire app lives here as tabbed [you] threads.
 * Sidebar tabs select threads, not routes.
 * Each thread is a persistent conversation with [you] scoped to a topic.
 * [chat]/[page] toggle available per thread.
 *
 * The intake conversation ([conversation] thread) retains its
 * existing orb + block-based engine.
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

const UnifiedChat = dynamic(() => import("@/components/chat/UnifiedChat"), { ssr: false })

// Lazy-load page views for each thread
const ConnectionsPageView = dynamic(() => import("@/app/connections/PageView"), { ssr: false })
const InsightsPageView = dynamic(() => import("@/app/insights/PageView"), { ssr: false })
const JournalPageView = dynamic(() => import("@/app/journal/PageView"), { ssr: false })
const AboutPageView = dynamic(() => import("@/app/about/PageView"), { ssr: false })
const ProfilePageView = dynamic(() => import("@/app/profile/PageView"), { ssr: false })
const SettingsPageView = dynamic(() => import("@/app/settings/PageView"), { ssr: false })
const TermsPageView = dynamic(() => import("@/app/terms/PageView"), { ssr: false })
const PrivacyPageView = dynamic(() => import("@/app/privacy/PageView"), { ssr: false })

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

// ─────────────────────────────────────────────
// THREAD CHAT VIEW
// Generic chat UI for non-intake threads
// ─────────────────────────────────────────────

function ThreadChatView({ threadType, userId }: { threadType: ThreadType; userId: string }) {
  const isMessages = threadType === "messages"
  const thread = useThread(threadType, userId)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = () => {
    if (!input.trim()) return
    thread.sendMessage(input.trim())
    setInput("")
  }

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

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 40px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        justifyContent: thread.messages.length === 1 ? "flex-end" : "flex-start",
        paddingBottom: thread.messages.length === 1 ? "24px" : "16px",
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

      {/* Input */}
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
            placeholder="[say something...]"
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "var(--bg)" : "var(--dim)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
      `}</style>
      </div>{/* end centered content column */}
    </div>
  )
}

// ─────────────────────────────────────────────
// VIEW MODE TOGGLE
// ─────────────────────────────────────────────

function ViewToggle({
  viewMode,
  onToggle,
  hasPageView,
}: {
  viewMode: "chat" | "page"
  onToggle: () => void
  hasPageView: boolean
}) {
  if (!hasPageView) return null

  return (
    <button
      onClick={onToggle}
      aria-label={viewMode === "chat" ? "switch to page view" : "switch to chat view"}
      style={{
        position: "absolute",
        top: "16px",
        right: "20px",
        zIndex: 20,
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        letterSpacing: "0.06em",
        padding: "6px 10px",
        minHeight: "44px",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      {viewMode === "chat" ? "[page view]" : "[chat view]"}
    </button>
  )
}

// ─────────────────────────────────────────────
// PAGE VIEW RENDERER
// ─────────────────────────────────────────────

function PageViewRenderer({ threadType }: { threadType: ThreadType }) {
  switch (threadType) {
    case "connections": return <ConnectionsPageView />
    case "insights": return <InsightsPageView />
    case "journal": return <JournalPageView />
    case "about": return <AboutPageView />
    case "profile": return <ProfilePageView />
    case "settings": return <SettingsPageView />
    case "terms": return <TermsPageView />
    case "privacy": return <PrivacyPageView />
    default: return null
  }
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
  const [viewMode, setViewMode] = useState<"chat" | "page">("chat")

  const intake = useIntake()
  const initialized = useRef(false)

  const hasMessages = intake.messages.length > 0
  const orbState = intake.isRecording ? "recording"
    : intake.isThinking ? "thinking"
    : intake.isSpeaking ? "speaking"
    : "idle"

  const isConversationThread = activeThread === "conversation"
  const config = THREAD_CONFIGS[activeThread]

  // switch thread via URL
  const switchThread = (thread: ThreadType) => {
    router.push(`/conversation?thread=${thread}`)
  }

  // load view mode for active thread
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(`us_thread_view_${activeThread}`)
    setViewMode(saved === "page" ? "page" : "chat")
  }, [activeThread])

  const toggleViewMode = () => {
    const next = viewMode === "chat" ? "page" : "chat"
    setViewMode(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(`us_thread_view_${activeThread}`, next)
    }
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

  // initialize on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const uid = getOrCreateUserId()
    setUserId(uid)
    setPortraitAsBackground(localStorage.getItem("us_portrait_bg") === "true")

    // clear any stale thread view preferences — always start in chat mode
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("us_thread_view_")) localStorage.removeItem(key)
    })

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
      {/* Sidebar — passes active thread and switch handler */}
      <Sidebar
        activeThread={activeThread}
        onThreadSelect={switchThread}
      />

      <main style={{
        flex: 1,
        marginLeft: "var(--sidebar-width)",
        width: "calc(100vw - var(--sidebar-width))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        alignItems: "center",
        background: "var(--bg)",
      }}>

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

        {/* View toggle — all threads except conversation */}
        {!isConversationThread && (
          <ViewToggle
            viewMode={viewMode}
            onToggle={toggleViewMode}
            hasPageView={config.hasPageView}
          />
        )}

        {/* Portrait toggle — conversation thread only */}
        {isConversationThread && (
          <button
            aria-label={portraitAsBackground ? "hide portrait background" : "show portrait background"}
            onClick={() => {
              const next = !portraitAsBackground
              setPortraitAsBackground(next)
              localStorage.setItem("us_portrait_bg", String(next))
            }}
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
              minHeight: "44px",
            }}
          >
            {portraitAsBackground ? "[portrait on]" : "[portrait]"}
          </button>
        )}

        {/* ── CONVERSATION THREAD — intake engine ── */}
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
                <div
                  onMouseDown={handleTap}
                  onMouseUp={handleTapEnd}
                  onMouseLeave={handleTapEnd}
                  onTouchStart={(e) => { e.preventDefault(); handleTap() }}
                  onTouchEnd={handleTapEnd}
                  style={{ cursor: "pointer", userSelect: "none" }}
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
              <ThreadChatView threadType={activeThread} userId={userId} />
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
