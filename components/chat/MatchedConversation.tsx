"use client"

/**
 * MatchedConversation — two real users talking
 *
 * Polls /api/conversation/[id] every 5 seconds for new messages.
 * Sends via POST /api/conversation/[id].
 * Uses same visual language as ThreadChatView.
 */

import { useState, useEffect, useRef, useCallback } from "react"

interface ConversationMessage {
  id: string
  role: string
  content: string
  createdAt: string
  isMe: boolean
}

interface Props {
  conversationId: string
  userId: string
  firstPrompt: string | null
}

const POLL_INTERVAL_MS = 5000

export default function MatchedConversation({ conversationId, userId, firstPrompt }: Props) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [ended, setEnded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestMessageIdRef = useRef<string | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/conversation/${conversationId}?userId=${encodeURIComponent(userId)}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.status === "ended") setEnded(true)
      setMessages(data.messages ?? [])
      setLoaded(true)
      const last = data.messages?.at(-1)
      if (last) latestMessageIdRef.current = last.id
    } catch {
      // silent
    }
  }, [conversationId, userId])

  // initial fetch
  useEffect(() => { fetchMessages() }, [fetchMessages])

  // poll every 5s
  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || ended) return
    setSending(true)
    setInput("")
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
    try {
      await fetch(`/api/conversation/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: text }),
      })
      await fetchMessages()
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      position: "relative",
    }}>

      {/* first prompt — shown above messages if no messages yet */}
      {!hasMessages && firstPrompt && loaded && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "28vh",
          padding: "28vh 24px 0",
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}>
            <div style={{
              padding: "14px 18px",
              borderRadius: "20px 20px 20px 6px",
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "13.5px",
              fontWeight: 300,
              lineHeight: 1.65,
              color: "var(--text)",
              textAlign: "center",
            }}>
              {firstPrompt}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
              letterSpacing: "0.06em",
              opacity: 0.6,
            }}>
              say something
            </div>
          </div>
        </div>
      )}

      {/* loading state */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "12px",
            color: "var(--muted)", animation: "pulse 1.5s ease-in-out infinite",
          }}>
            [loading...]
          </span>
        </div>
      )}

      {/* messages */}
      {hasMessages && (
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          scrollbarWidth: "none",
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "70%",
              alignSelf: msg.isMe ? "flex-end" : "flex-start",
            }}>
              <div style={{
                padding: "11px 15px",
                borderRadius: msg.isMe ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                fontSize: "13.5px",
                fontWeight: 300,
                lineHeight: 1.65,
                color: "var(--text)",
                background: msg.isMe ? "var(--bg3)" : "var(--bg2)",
                border: `1px solid ${msg.isMe ? "var(--border2)" : "var(--border)"}`,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ended state */}
      {ended && (
        <div style={{
          padding: "12px 24px",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted)",
          opacity: 0.5,
          flexShrink: 0,
        }}>
          [this conversation has ended]
        </div>
      )}

      {/* input */}
      {!ended && (
        <div style={{
          padding: "16px 24px 24px",
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
            opacity: sending ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="[say something...]"
              aria-label="send message"
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
              onClick={handleSend}
              disabled={sending || !input.trim()}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="send"
              style={{
                width: "44px", height: "44px",
                borderRadius: "10px", border: "none",
                background: "rgba(196,151,74,0.14)",
                cursor: sending || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                opacity: sending || !input.trim() ? 0.4 : 1,
                transition: "opacity 0.15s",
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
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
