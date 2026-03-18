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
 *
 * FIXES APPLIED:
 * 1. Hold-to-speak gesture on entire <main> content area, not just orb
 * 2. "or type below" matches "hold anywhere to speak" color (var(--muted))
 * 3. Disclaimer beneath every chat input across all threads
 * 4. Opening prompt IS the contextual bubble — only one shown, never duplicated
 * 5. Journal consent toggle rendered in journal thread chat view
 * 6. viewMode always defaults to "chat"; localStorage only read if user set it
 *    this session. viewMode fully removed from useThread to prevent race.
 * 7. Pulsating orb rendered on every thread (scaled down for non-conversation)
 * 8. [page view] toggle same size as [portrait] and [lock voice]
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

// Shared toggle button style — same size for [portrait], [lock voice], [page view]
const TOGGLE_BUTTON_STYLE: React.CSSProperties = {
  background: "transparent",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  padding: "6px 10px",
  minHeight: "44px",
  transition: "border-color 0.15s, color 0.15s, opacity 0.15s",
}

// ─────────────────────────────────────────────
// THREAD CHAT VIEW
// Generic chat UI for non-intake threads
// FIX 3: disclaimer on every input
// FIX 4: one bubble only (opening prompt = contextual bubble)
// FIX 5: journal consent toggle
// FIX 7: pulsating orb on every thread
// ─────────────────────────────────────────────

function ThreadChatView({
  threadType,
  userId,
}: {
  threadType: ThreadType
  userId: string
}) {
  const thread = useThread(threadType, userId)
  const [input, setInput] = useState("")
  const [journalConsentVisible, setJournalConsentVisible] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMessages = threadType === "messages"
  const contextPrompt = THREAD_CONTEXT_PROMPTS[threadType] ?? ""

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = () => {
    if (!input.trim()) return
    thread.sendMessage(input.trim())
    setInput("")
  }

  // FIX 4: thread.messages already contains the single opening bubble from useThread.
  // No duplicate — we render thread.messages as-is. The opening prompt IS the contextual bubble.
  const hasUserReplied = thread.messages.length > 1

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

        {/* FIX 5: Journal consent toggle — top of journal chat view */}
        {threadType === "journal" && journalConsentVisible && (
          <div style={{
            padding: "12px 40px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
              letterSpacing: "0.04em",
            }}>
              [you] cannot see your journal
            </span>
            <button
              onClick={() => setJournalConsentVisible(false)}
              aria-label="dismiss journal privacy notice"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--dim)",
                padding: "4px 8px",
              }}
            >
              [ok]
            </button>
          </div>
        )}

        {/* FIX 7: Pulsating orb + single opening bubble when no user reply yet */}
        {!hasUserReplied && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: "32px",
          }}>
            <div style={{ transform: "scale(1.2)", transformOrigin: "center center" }}>
              <AmbientOrb
                isRecording={false}
                orbState="idle"
                isLocked={false}
              />
            </div>
            {/* FIX 4: Single opening bubble — the opening prompt from useThread */}
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
            {/* FIX 2: "or type below" — var(--muted) */}
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
              letterSpacing: "0.04em",
            }}>
              or type below
            </span>
          </div>
        )}

        {/* Messages (after first user reply) */}
        {hasUserReplied && (
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
        )}

        {/* Input */}
        <div style={{
          padding: "16px 40px 24px",
          borderTop: hasUserReplied ? "1px solid var(--border)" : "none",
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
              placeholder={contextPrompt || "[say something...]"}
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
          {/* FIX 3: Disclaimer on every thread input */}
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
// FIX 8: same size as [portrait] and [lock voice]
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
        ...TOGGLE_BUTTON_STYLE,
        position: "absolute",
        top: "16px",
        right: "20px",
        zIndex: 20,
        border: "1px solid var(--border)",
        color: "var(--muted)",
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
  const [placeholder, setPlaceholder] = useState(CONVERSATION_PROMPTS[0])

  // FIX 6: viewMode always starts as "chat". localStorage is NOT read on mount.
  // Only written when user explicitly toggles. Cleared on thread switch.
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

  // switch thread via URL — reset viewMode to "chat" on every tab switch
  const switchThread = (thread: ThreadType) => {
    setViewMode("chat")
    router.push(`/conversation?thread=${thread}`)
  }

  // FIX 6: viewMode resets to "chat" on thread change. No localStorage read.
  useEffect(() => {
    setViewMode("chat")
  }, [activeThread])

  const toggleViewMode = () => {
    const next = viewMode === "chat" ? "page" : "chat"
    setViewMode(next)
  }

  const handleToggleLock = () => {
    setIsLocked((prev) => {
      if (prev && intake.isRecording) intake.stopRecording()
      return !prev
    })
  }

  // FIX 1: handleTap / handleTapEnd placed on <main>, not just the orb div.
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

  // initialize on mount
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
      {/* Sidebar */}
      <Sidebar
        activeThread={activeThread}
        onThreadSelect={switchThread}
      />

      {/* FIX 1: Hold-to-speak gesture on entire <main>, scoped to conversation thread */}
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

        {/* FIX 8: View toggle — same size as portrait/lock voice */}
        {!isConversationThread && (
          <ViewToggle
            viewMode={viewMode}
            onToggle={toggleViewMode}
            hasPageView={config.hasPageView}
          />
        )}

        {/* Portrait toggle + lock voice — conversation thread only */}
        {isConversationThread && (
          <div style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "flex-end",
          }}>
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
                border: "1px solid var(--amber)",
                color: "var(--amber)",
                opacity: portraitAsBackground ? 0.9 : 0.45,
              }}
            >
              {portraitAsBackground ? "[portrait on]" : "[portrait]"}
            </button>
            <button
              aria-label={isLocked ? "unlock voice" : "lock voice"}
              onClick={(e) => { e.stopPropagation(); handleToggleLock() }}
              style={{
                ...TOGGLE_BUTTON_STYLE,
                background: isLocked ? "var(--amber)" : "transparent",
                border: "1px solid var(--amber)",
                color: isLocked ? "var(--bg)" : "var(--amber)",
                opacity: isLocked ? 1 : 0.45,
              }}
            >
              {isLocked ? "[voice locked]" : "[lock voice]"}
            </button>
          </div>
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
                {/* Orb — tap handled by <main> mousedown */}
                <div style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                  <AmbientOrb
                    isRecording={intake.isRecording}
                    orbState={orbState}
                    isLocked={isLocked}
                  />
                </div>

                {/* FIX 2: hint text — both var(--muted) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
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
