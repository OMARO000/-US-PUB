"use client"

/**
 * AmbientYou
 *
 * Persistent floating [you] access on all pages except /conversation and /onboarding.
 * Collapsed: small amber pill.
 * Expanded: voice + text input bar.
 * Response floats as a bubble above the pill, auto-fades after 8s.
 * Dismissible per-session via [x].
 */

import { useState, useRef, useEffect, useCallback } from "react"

export default function AmbientYou() {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [response, setResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showBubble, setShowBubble] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check session dismissal on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem("us_ambient_dismissed") === "true")
    }
  }, [])

  // Auto-fade bubble 8s after streaming ends
  useEffect(() => {
    if (!isStreaming && response) {
      fadeTimerRef.current = setTimeout(() => {
        setShowBubble(false)
        setResponse("")
      }, 8000)
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [isStreaming, response])

  const handleDismiss = () => {
    sessionStorage.setItem("us_ambient_dismissed", "true")
    setDismissed(true)
  }

  const clearBubble = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    setShowBubble(false)
    setResponse("")
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    setInputText("")
    clearBubble()
    setResponse("")
    setShowBubble(true)
    setIsStreaming(true)

    const userId = typeof window !== "undefined" ? localStorage.getItem("us_uid") : null
    const conversationId = typeof window !== "undefined" ? localStorage.getItem("us_conversation_id") : null

    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId, conversationId }),
      })

      if (!res.ok || !res.body) {
        setResponse("[you] isn't available right now.")
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Parse SSE lines
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.token ?? parsed.text ?? parsed.content ?? ""
              if (token) {
                accumulated += token
                setResponse(accumulated)
              }
            } catch {
              // plain text delta
              if (data) {
                accumulated += data
                setResponse(accumulated)
              }
            }
          }
        }
      }
    } catch {
      setResponse("[you] isn't available right now.")
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const handleSend = () => {
    sendMessage(inputText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape") setExpanded(false)
  }

  const toggleVoice = () => {
    if (typeof window === "undefined") return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) return

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = "en-US"
    recognitionRef.current = rec

    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ""
      if (transcript) sendMessage(transcript)
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)

    rec.start()
    setIsListening(true)
  }

  if (dismissed) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {/* Response bubble */}
      {showBubble && (
        <div
          onClick={clearBubble}
          style={{
            pointerEvents: "auto",
            maxWidth: "340px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--text)",
            fontWeight: 300,
            lineHeight: 1.65,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            cursor: "pointer",
            animation: "ambientFadeIn 0.2s ease",
            position: "relative",
          }}
        >
          {response}
          {isStreaming && (
            <span style={{
              display: "inline-block",
              width: "5px",
              height: "12px",
              background: "var(--amber)",
              marginLeft: "2px",
              opacity: 0.7,
              animation: "ambientBlink 0.8s step-end infinite",
              verticalAlign: "text-bottom",
            }} />
          )}
        </div>
      )}

      {/* Expanded input bar */}
      {expanded && (
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg2)",
            border: "1px solid var(--border2)",
            borderRadius: "16px",
            padding: "8px 12px",
            width: "320px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            animation: "ambientFadeIn 0.15s ease",
          }}
        >
          {/* Voice button */}
          <button
            aria-label={isListening ? "stop listening" : "speak to [you]"}
            onClick={toggleVoice}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              background: isListening ? "var(--rose)" : "var(--bg3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isListening ? "#fff" : "var(--muted)"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="[ask [you] anything…]"
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = "auto"
              t.style.height = Math.min(t.scrollHeight, 80) + "px"
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              fontWeight: 300,
              resize: "none",
              lineHeight: 1.5,
            }}
          />

          {/* Send button */}
          <button
            aria-label="send"
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              background: inputText.trim() ? "rgba(196,151,74,0.18)" : "transparent",
              cursor: inputText.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>

          {/* Collapse */}
          <button
            aria-label="collapse"
            onClick={() => setExpanded(false)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "var(--dim)",
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Pill — collapsed state */}
      {!expanded && (
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            aria-label="speak to [you]"
            onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            style={{
              height: "34px",
              padding: "0 16px",
              borderRadius: "17px",
              border: "1px solid var(--border2)",
              background: "var(--bg2)",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.05em",
              opacity: 0.7,
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            [speak to [you]]
          </button>

          {/* Dismiss */}
          <button
            aria-label="dismiss [you] assistant"
            onClick={handleDismiss}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--dim)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              opacity: 0.5,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes ambientFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ambientBlink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
