"use client"

import { useEffect, useRef } from "react"
import { useThread } from "@/hooks/useThread"
import AmbientOrb from "@/components/chat/AmbientOrb"
import DMAnalysisBanner from "@/components/chat/DMAnalysisBanner"
import type { ThreadType } from "@/lib/threads/threadPrompts"
import { THREAD_CONTEXT_PROMPTS } from "@/lib/threads/conversationPrompts"

// ─────────────────────────────────────────────
// THREAD CHAT VIEW
// key={activeThread} set at call site — full remount on every tab switch
// Input clones UnifiedChat exactly for pixel-identical layout
// ─────────────────────────────────────────────

export default function ThreadChatView({
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

  // ── Cloned UnifiedChat input block ──
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

      {/* ── Empty state — pinned to 28vh, identical to conversation tab ── */}
      {/* On messages thread, banner is 44px in normal flow above this absolute div,
          so we reduce paddingTop by 44px to keep orb at same visual position */}
      {!hasConversation && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: isMessagesThread ? "calc(28vh - 44px)" : "28vh",
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

            {/* Opening bubble */}
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
