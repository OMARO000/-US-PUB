"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useThread } from "@/hooks/useThread"
import AmbientOrb from "@/components/chat/AmbientOrb"
import DMAnalysisBanner from "@/components/chat/DMAnalysisBanner"
import type { ThreadType } from "@/lib/threads/threadPrompts"
import { THREAD_CONFIGS } from "@/lib/threads/threadPrompts"
import { THREAD_CONTEXT_PROMPTS } from "@/lib/threads/conversationPrompts"

// ─────────────────────────────────────────────
// TYPED OPENING HOOK
// Types out the opening prompt on every mount
// ─────────────────────────────────────────────

function useTypedOpening(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!text) { setDone(true); return }
    indexRef.current = 0
    setDisplayed("")
    setDone(false)
    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        setDone(true)
        clearInterval(interval)
        return
      }
      setDisplayed(text.slice(0, indexRef.current + 1))
      indexRef.current += 1
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, done }
}

// ─────────────────────────────────────────────
// THREAD CHAT VIEW
// key={activeThread} set at call site — full remount on every tab switch
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
  const config = THREAD_CONFIGS[threadType]
  const openingPrompt = config?.openingPrompt ?? ""

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { displayed: typedOpening, done: openingDone } = useTypedOpening(openingPrompt)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((t) => t.stop())
        try {
          const res = await fetch("/api/intake/transcribe", {
            method: "POST",
            headers: { "Content-Type": "audio/webm" },
            body: blob,
          })
          if (!res.ok) return
          const data = await res.json()
          if (!data.empty && data.transcript && inputRef.current) {
            inputRef.current.value = data.transcript
            inputRef.current.style.height = "auto"
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 110) + "px"
          }
        } catch { }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch { }
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }, [isRecording])

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
          aria-label="message [them]"
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
            width: "44px", height: "44px", borderRadius: "10px", border: "none",
            background: "rgba(196,151,74,0.14)",
            cursor: thread.isStreaming ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div style={{
        textAlign: "center", marginTop: "8px", fontSize: "12px",
        fontFamily: "var(--font-mono)", color: "var(--muted)", opacity: 0.6, lineHeight: 1.5,
      }}>
        by talking to [them], an AI, you agree to our{" "}
        <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>[terms]</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>[privacy policy]</a>
      </div>
    </div>
  )

  return (
    <div
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        height: "100%", width: "100%", position: "relative",
      }}
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={stopRecording}
      onTouchStart={(e) => { e.preventDefault(); startRecording() }}
      onTouchEnd={stopRecording}
    >
      <style>{`
        .us-textarea:focus-visible {
          outline: 2px solid var(--amber) !important;
          outline-offset: 2px;
          border-radius: 4px;
        }
        @keyframes blink { 0%, 100% { opacity: 0.7; } 50% { opacity: 0; } }
      `}</style>

      {/* DM analysis banner — messages thread only */}
      {isMessagesThread && <DMAnalysisBanner />}

      {/* Empty state */}
      {!hasConversation && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: isMessagesThread ? "calc(28vh - 44px)" : "28vh",
        }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            width: "100%", maxWidth: "1100px", padding: "0 24px",
          }}>
            {/* Orb */}
            <div
              style={{ transform: "scale(2)", transformOrigin: "center center", marginBottom: "80px" }}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording() }}
              onTouchEnd={stopRecording}
            >
              <AmbientOrb
                isRecording={isRecording}
                orbState={isRecording ? "recording" : "idle"}
                isLocked={isLocked}
                onToggleLock={onToggleLock}
              />
            </div>

            {/* Typed opening bubble */}
            {openingPrompt && (
              <div style={{
                maxWidth: "560px", width: "100%",
                padding: "14px 18px",
                borderRadius: "20px 20px 20px 6px",
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: 1.7,
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                textAlign: "center",
                marginBottom: "32px",
                minHeight: "52px",
              }}>
                {typedOpening}
                {!openingDone && (
                  <span style={{
                    display: "inline-block", width: "7px", height: "15px",
                    background: "var(--amber)", marginLeft: "2px", opacity: 0.7,
                    animation: "blink 0.8s step-end infinite", verticalAlign: "text-bottom",
                  }} />
                )}
              </div>
            )}

            {/* Hold prompt */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "6px", marginBottom: "32px",
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

            <div style={{ width: "100%" }}>{InputBlock}</div>
          </div>
        </div>
      )}

      {/* Active conversation */}
      {hasConversation && (
        <>
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "24px 24px 16px",
            display: "flex", flexDirection: "column",
            gap: "20px", scrollbarWidth: "none",
          }}>
            {thread.messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex", flexDirection: "column",
                maxWidth: "72%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  padding: "14px 18px",
                  borderRadius: msg.role === "you" ? "20px 20px 20px 6px" : "20px 20px 6px 20px",
                  fontSize: "15px",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: "var(--text)",
                  background: msg.role === "you" ? "var(--bg2)" : "var(--bg3)",
                  border: `1px solid ${msg.role === "you" ? "var(--border)" : "var(--border2)"}`,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                  {msg.role === "you" && thread.isStreaming && !msg.content && (
                    <span style={{
                      display: "inline-block", width: "7px", height: "14px",
                      background: "var(--amber)", opacity: 0.7,
                      animation: "blink 0.8s step-end infinite",
                      verticalAlign: "text-bottom", marginLeft: "2px",
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
    </div>
  )
}
