"use client"
import { useState, useEffect, useRef } from "react"
import { TAB_QUESTIONS } from "@/lib/tabQuestions"
import UFigure from "./UFigure"

interface UViewProps {
  tab: string
  onSendText?: (text: string) => void
  onHoldStart?: () => void
  onHoldEnd?: () => void
  isListening?: boolean
  paddingTop?: string
}

export default function UView({ tab, onSendText, onHoldStart, onHoldEnd, isListening, paddingTop }: UViewProps) {
  const questions = TAB_QUESTIONS[tab] ?? ["what's on your mind?"]
  const [currentQ, setCurrentQ] = useState(0)
  const [visible, setVisible] = useState(true)
  const [typing, setTyping] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [holdingDown, setHoldingDown] = useState(false)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentQ(prev => (prev + 1) % questions.length)
        setVisible(true)
      }, 400)
    }, 9000)
    return () => clearInterval(interval)
  }, [questions])

  const handleHoldStart = () => {
    setHoldingDown(true)
    holdTimer.current = setTimeout(() => {
      onHoldStart?.()
    }, 1000)
  }

  const handleHoldEnd = () => {
    setHoldingDown(false)
    if (holdTimer.current) clearTimeout(holdTimer.current)
    onHoldEnd?.()
  }

  const handleSend = () => {
    const text = userInput.trim()
    if (!text) return
    onSendText?.(text)
    setUserInput("")
    setTyping(false)
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      paddingTop: paddingTop ?? "15vh",
    }}>
      <style>{`
        @keyframes uview-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .uview-cursor { animation: uview-blink 1s step-end infinite; color: var(--amber); }
      `}</style>

      {/* Bubble */}
      <div
        onClick={() => { if (!typing) { setTyping(true); setTimeout(() => inputRef.current?.focus(), 0) } }}
        style={{
          background: "rgba(196,151,74,0.08)",
          border: "1px solid rgba(196,151,74,0.3)",
          borderRadius: "12px",
          padding: "28px 36px",
          maxWidth: "538px",
          width: "100%",
          textAlign: "center",
          marginBottom: "8px",
          cursor: typing ? "default" : "text",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <p style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: "15px",
          color: "var(--text)",
          lineHeight: 1.65,
          letterSpacing: "0.02em",
          margin: "0 0 16px 0",
        }}>
          {questions[currentQ]}
        </p>
        <div style={{ width: "100%", height: "1px", background: "rgba(196,151,74,0.2)", marginBottom: "14px" }}/>

        {typing ? (
          <div style={{ position: "relative", textAlign: "left" }}>
            {userInput === "" && (
              <span style={{
                position: "absolute",
                top: 0,
                left: 0,
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: "13px",
                color: "rgba(196,151,74,0.45)",
                letterSpacing: "0.04em",
                pointerEvents: "none",
              }}>
                conversing with [u], starts with you<span className="uview-cursor">_</span>
              </span>
            )}
            <textarea
              ref={inputRef}
              value={userInput}
              autoFocus
              rows={1}
              onChange={(e) => {
                setUserInput(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                if (e.key === "Escape") { e.preventDefault(); setTyping(false); setUserInput("") }
              }}
              onBlur={() => { if (!userInput.trim()) { setTyping(false) } }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: "13px",
                color: "var(--text)",
                letterSpacing: "0.04em",
                lineHeight: 1.65,
                resize: "none",
                caretColor: "var(--amber)",
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "rgba(196,151,74,0.45)", letterSpacing: "0.1em" }}>tap to type</span>
            <span style={{ width: "1px", height: "12px", background: "rgba(196,151,74,0.35)", display: "inline-block" }}/>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "var(--amber)", letterSpacing: "0.1em" }}>hold [u] to speak</span>
          </div>
        )}
      </div>

      {/* Legal line */}
      <p style={{
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontSize: "10px",
        color: "var(--dim)",
        textAlign: "center",
        marginBottom: "4px",
        letterSpacing: "0.04em",
        lineHeight: 1.6,
      }}>
        by talking to [u], an AI, you agree to our{" "}
        <a href="/terms" style={{ color: "rgba(196,151,74,0.5)", textDecoration: "none" }}>[terms]</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "rgba(196,151,74,0.5)", textDecoration: "none" }}>[privacy policy]</a>
        .
      </p>

      {/* UFigure */}
      <div
        role="button"
        aria-label="hold to speak"
        tabIndex={0}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={(e) => { e.preventDefault(); handleHoldStart() }}
        onTouchEnd={handleHoldEnd}
        onKeyDown={(e) => { if (e.code === "Space") { e.preventDefault(); handleHoldStart() } }}
        onKeyUp={(e) => { if (e.code === "Space") { e.preventDefault(); handleHoldEnd() } }}
        style={{
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          transition: "transform 0.2s ease, filter 0.2s ease",
          transform: holdingDown ? "scale(1.04)" : "scale(1)",
          filter: holdingDown ? "drop-shadow(0 0 12px rgba(196,151,74,0.4))" : "none",
          marginTop: "0px",
        }}
      >
        <UFigure state={isListening ? "listening" : "idle"} scale={2.5} />
      </div>
    </div>
  )
}
