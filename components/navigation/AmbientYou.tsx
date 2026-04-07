"use client"

/**
 * AmbientYou
 *
 * Persistent floating [u] access on all pages except /conversation and /onboarding.
 * Collapsed: small amber pill with hold-to-speak.
 * Expanded: voice + text input bar.
 * Response floats as a bubble above the pill, auto-fades after 8s.
 * Dismissible per-session via [x].
 */

import { useState, useRef, useEffect, useCallback } from "react"

const HOLD_THRESHOLD_MS = 300

export default function AmbientYou() {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [response, setResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showBubble, setShowBubble] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStartRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const spaceHeldRef = useRef(false)

  // Check session dismissal on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem("us_ambient_dismissed") === "true")
    }
  }, [])

  // Global Space key hold-to-record
  useEffect(() => {
    if (dismissed) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return
      // Skip if focus is on an input/textarea/contenteditable
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable) return
      e.preventDefault()
      if (spaceHeldRef.current) return
      spaceHeldRef.current = true
      pressStartRef.current = Date.now()
      holdTimerRef.current = setTimeout(() => startRecording(), HOLD_THRESHOLD_MS)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      if (!spaceHeldRef.current) return
      spaceHeldRef.current = false
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      const held = Date.now() - pressStartRef.current
      if (held < HOLD_THRESHOLD_MS) {
        // quick tap — toggle expanded
        setExpanded((prev) => {
          if (!prev) setTimeout(() => inputRef.current?.focus(), 50)
          return !prev
        })
      } else {
        stopRecording()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
    }
  }, [dismissed])

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
        setResponse("[u] isn't available right now.")
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
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.token ?? parsed.text ?? parsed.content ?? ""
              if (token) { accumulated += token; setResponse(accumulated) }
            } catch {
              if (data) { accumulated += data; setResponse(accumulated) }
            }
          }
        }
      }
    } catch {
      setResponse("[u] isn't available right now.")
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      // mic denied — silently fail
    }
  }, [isRecording])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === "inactive") return
    recorder.onstop = async () => {
      setIsRecording(false)
      if (audioChunksRef.current.length === 0) return
      setIsTranscribing(true)
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      // stop all tracks
      recorder.stream.getTracks().forEach((t) => t.stop())
      mediaRecorderRef.current = null
      try {
        const form = new FormData()
        form.append("audio", blob, "recording.webm")
        const userId = localStorage.getItem("us_uid") ?? ""
        if (userId) form.append("userId", userId)
        const res = await fetch("/api/intake/transcribe", { method: "POST", body: form })
        if (res.ok) {
          const data = await res.json()
          const transcript: string = data.transcript ?? data.text ?? ""
          if (transcript) sendMessage(transcript)
        }
      } catch {
        // silent
      } finally {
        setIsTranscribing(false)
      }
    }
    recorder.stop()
  }, [sendMessage])

  // Pill pointer handlers — hold vs tap
  const onPillPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ("button" in e && e.button !== 0) return
    pressStartRef.current = Date.now()
    holdTimerRef.current = setTimeout(() => startRecording(), HOLD_THRESHOLD_MS)
  }

  const onPillPointerUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    const held = Date.now() - pressStartRef.current
    if (held < HOLD_THRESHOLD_MS) {
      // quick tap
      if (!isRecording) {
        setExpanded((prev) => {
          if (!prev) setTimeout(() => inputRef.current?.focus(), 50)
          return !prev
        })
      }
    } else {
      stopRecording()
    }
  }

  const handleSend = () => sendMessage(inputText)

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === "Escape") setExpanded(false)
  }

  const pillLabel = isRecording ? "[listening…]" : isTranscribing ? "[thinking…]" : "[speak to [u]]"
  const pillGlow = isRecording
    ? "0 0 0 3px rgba(196,151,74,0.25), 0 2px 12px rgba(196,151,74,0.2)"
    : "none"

  if (dismissed) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "calc(var(--sidebar-width) + (100vw - var(--sidebar-width)) / 2)",
        transform: "translateX(-50%)",
        zIndex: 40,
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
            aria-label={isRecording ? "stop recording" : "hold to speak"}
            onMouseDown={() => startRecording()}
            onMouseUp={() => stopRecording()}
            onMouseLeave={() => stopRecording()}
            onTouchStart={(e) => { e.preventDefault(); startRecording() }}
            onTouchEnd={() => stopRecording()}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              background: isRecording ? "var(--amber)" : "var(--bg3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
              boxShadow: isRecording ? "0 0 0 3px rgba(196,151,74,0.2)" : "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isRecording ? "var(--bg)" : "var(--muted)"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            onKeyDown={handleTextKeyDown}
            placeholder="[ask [u] anything…]"
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

          {/* Send */}
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
        <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            aria-label={pillLabel}
            onMouseDown={onPillPointerDown}
            onMouseUp={onPillPointerUp}
            onMouseLeave={onPillPointerUp}
            onTouchStart={(e) => { e.preventDefault(); onPillPointerDown(e) }}
            onTouchEnd={onPillPointerUp}
            style={{
              height: "52px",
              padding: "16px 32px",
              borderRadius: "26px",
              border: `1.5px solid ${isRecording ? "var(--amber)" : "var(--amber)"}`,
              background: isRecording ? "rgba(196,151,74,0.15)" : "var(--bg2)",
              cursor: "pointer",
              fontSize: "16px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.05em",
              opacity: isRecording || isTranscribing ? 1 : 0.85,
              transition: "opacity 0.15s, box-shadow 0.15s, background 0.15s",
              whiteSpace: "nowrap",
              boxShadow: pillGlow,
              animation: isRecording ? "ambientPillPulse 1s ease-in-out infinite" : "none",
            }}
            onMouseEnter={(e) => { if (!isRecording) e.currentTarget.style.opacity = "1" }}
          >
            {pillLabel}
          </button>

          {/* Dismiss */}
          <button
            aria-label="dismiss [u] assistant"
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
        @keyframes ambientPillPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(196,151,74,0.15); }
          50%       { box-shadow: 0 0 0 5px rgba(196,151,74,0.28); }
        }
      `}</style>
    </div>
  )
}
