"use client";
import { useRef, useState, useEffect } from "react";
import UFigure from "@/components/UFigure";

const questions = [
  "what's been sitting with you lately that you haven't said out loud?",
  "when did you last feel completely like yourself?",
  "what are you pretending is fine?",
  "who do you become when no one is watching?",
  "what would you do if you stopped waiting for permission?",
  "what are you most afraid people would think if they really knew you?",
  "when did you last do something just for you?",
  "what feeling have you been avoiding?",
];

interface Message {
  id: string;
  role: "them" | "user";
  content: string;
  inputMode?: "voice" | "text";
}

interface UnifiedChatProps {
  messages: Message[];
  isRecording: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  isLocked: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onToggleLock: () => void;
  onSendText: (text: string) => void;
  onRephrase: () => void;
  disabled?: boolean;
  showMessages?: boolean;
  placeholder?: string;
  inputRows?: number;
}

export default function UnifiedChat({
  messages, isRecording, isThinking, isSpeaking,
  isLocked, onHoldStart, onHoldEnd, onToggleLock,
  onSendText, onRephrase, disabled = false,
  showMessages = true, placeholder, inputRows = 1,
}: UnifiedChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0 && showMessages;

  // ── Cycling speech bubble ─────────────────────────────────────────────────
  const [currentQ, setCurrentQ] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentQ(prev => (prev + 1) % questions.length);
        setVisible(true);
      }, 400);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // ── Inline typing mode ────────────────────────────────────────────────────
  const [typing, setTyping] = useState(false);
  const [userInput, setUserInput] = useState("");
  const bubbleInputRef = useRef<HTMLTextAreaElement>(null);

  const handleBubbleSend = () => {
    const text = userInput.trim();
    if (!text) return;
    onSendText(text);
    setUserInput("");
    setTyping(false);
  };

  const handleBubbleCancel = () => {
    setUserInput("");
    setTyping(false);
  };

  // ── Hold gesture (2s minimum) ─────────────────────────────────────────────
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdingDown, setHoldingDown] = useState(false);
  const [localListening, setLocalListening] = useState(false);

  const handleHoldStart = () => {
    setHoldingDown(true);
    holdTimer.current = setTimeout(() => {
      setIsHolding(true);
      setLocalListening(true);
      onHoldStart();
    }, 1000);
  };

  const handleHoldEnd = () => {
    setHoldingDown(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setLocalListening(false);
    if (isHolding) {
      setIsHolding(false);
      onHoldEnd();
    }
  };

  const figureState = (isRecording || isLocked || localListening) ? "listening" as const
    : isSpeaking ? "speaking" as const
    : "idle" as const;

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    onSendText(text);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
  };

  const handleBodyMouseDown = () => {
    if (inputRef.current?.contains(document.activeElement)) return;
    if (isLocked) {
      if (isRecording) onHoldEnd();
      else onHoldStart();
    } else {
      onHoldStart();
    }
  };
  const handleBodyMouseUp = () => {
    if (!isLocked) onHoldEnd();
  };

  const sharedStyles = (
    <style>{`
      @keyframes hintpulse { 0%,100%{opacity:0.55} 50%{opacity:1} }
      @keyframes uspulse { 0%,100%{opacity:0.12} 50%{opacity:0.8} }
      @keyframes usblink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      .us-dot-1 { animation: uspulse 1.6s ease-in-out infinite 0s; }
      .us-dot-2 { animation: uspulse 1.6s ease-in-out infinite 0.22s; }
      .us-dot-3 { animation: uspulse 1.6s ease-in-out infinite 0.44s; }
      .us-cursor { animation: usblink 1s step-end infinite; color: #C4974A; }
      .us-textarea:focus-visible {
        outline: 2px solid var(--amber) !important;
        outline-offset: 2px;
        border-radius: 4px;
      }
    `}</style>
  );

  // ── EMPTY STATE — centered figure with speech bubble (2.5× scale) ─────────
  if (!hasMessages) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
        {sharedStyles}

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          flex: 1,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>

            {/* Speech bubble — question + controls / typing */}
            <div
              onClick={() => { if (!typing) { setTyping(true); setTimeout(() => bubbleInputRef.current?.focus(), 0); } }}
              style={{
                background: "rgba(196,151,74,0.08)",
                border: "1px solid rgba(196,151,74,0.3)",
                borderRadius: "12px",
                padding: "22px 28px",
                maxWidth: "420px",
                width: "100%",
                textAlign: "center",
                marginBottom: "32px",
                cursor: typing ? "default" : "text",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            >
              <p style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: "13px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.65,
                letterSpacing: "0.02em",
                margin: "0 0 16px 0",
              }}>
                {questions[currentQ]}
              </p>
              <div style={{
                width: "100%",
                height: "1px",
                background: "rgba(196,151,74,0.2)",
                marginBottom: "14px",
              }}/>
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
                      [say something<span className="us-cursor">_</span>]
                    </span>
                  )}
                  <textarea
                    ref={bubbleInputRef}
                    value={userInput}
                    autoFocus
                    rows={1}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleBubbleSend(); }
                      if (e.key === "Escape") { e.preventDefault(); handleBubbleCancel(); }
                    }}
                    onBlur={handleBubbleCancel}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.9)",
                      letterSpacing: "0.04em",
                      lineHeight: 1.65,
                      resize: "none",
                      caretColor: "#C4974A",
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: "11px",
                    color: "rgba(196,151,74,0.45)",
                    letterSpacing: "0.1em",
                  }}>tap to type</span>
                  <span style={{ width: "1px", height: "12px", background: "rgba(196,151,74,0.35)", display: "inline-block" }}/>
                  <span style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: "11px",
                    color: "#C4974A",
                    letterSpacing: "0.1em",
                  }}>hold [u] to speak</span>
                </div>
              )}
            </div>

            {/* Legal — directly under bubble */}
            <p style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.25)",
              textAlign: "center",
              marginTop: "-20px",
              marginBottom: "24px",
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
              onTouchStart={(e) => { e.preventDefault(); handleHoldStart(); }}
              onTouchEnd={handleHoldEnd}
              onKeyDown={(e) => { if (e.code === "Space") { e.preventDefault(); handleHoldStart(); } }}
              onKeyUp={(e) => { if (e.code === "Space") { e.preventDefault(); handleHoldEnd(); } }}
              style={{
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                transition: "transform 0.2s ease, filter 0.2s ease",
                transform: holdingDown ? "scale(1.04)" : "scale(1)",
                filter: holdingDown ? "drop-shadow(0 0 12px rgba(196,151,74,0.4))" : "none",
              }}
            >
              <UFigure state={figureState} scale={5} />
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── CONVERSATION STATE — existing layout with messages ───────────────────
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {sharedStyles}

      {/* CHAT BODY */}
      {showMessages && (
        <div
          onMouseDown={handleBodyMouseDown}
          onMouseUp={handleBodyMouseUp}
          onMouseLeave={() => { if (!isLocked) onHoldEnd(); }}
          onTouchStart={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest(".no-record")) return;
            e.preventDefault();
            if (isLocked) {
              if (isRecording) onHoldEnd();
              else onHoldStart();
            } else {
              onHoldStart();
            }
          }}
          onTouchEnd={() => { if (!isLocked) onHoldEnd(); }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            scrollbarWidth: "none",
            cursor: "default",
            position: "relative",
          }}
        >
          <div
            aria-live="polite"
            aria-atomic="false"
            aria-busy={isThinking}
            style={{ display: "contents" }}
          >
            {messages.map((msg) => (
              <div key={msg.id} className="no-record" style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                maxWidth: "70%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  padding: "14px 18px",
                  borderRadius: msg.role === "them" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
                  fontSize: "15px",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: "var(--text)",
                  background: msg.role === "them" ? "var(--bg2)" : "var(--bg3)",
                  border: `1px solid ${msg.role === "them" ? "var(--border)" : "var(--border2)"}`,
                }}>
                  {msg.content}
                </div>
                {msg.role === "them" && (
                  <button
                    className="no-record"
                    aria-label="rephrase this"
                    onClick={(e) => { e.stopPropagation(); onRephrase(); }}
                    style={{
                      alignSelf: "flex-start",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "12px 4px",
                      minHeight: "44px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    [rephrase]
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORB */}
      <div
        className="no-record"
        role="button"
        aria-label="hold to speak"
        tabIndex={0}
        onMouseDown={handleBodyMouseDown}
        onMouseUp={handleBodyMouseUp}
        onMouseLeave={handleBodyMouseUp}
        onTouchStart={(e) => { e.preventDefault(); handleBodyMouseDown(); }}
        onTouchEnd={handleBodyMouseUp}
        onKeyDown={(e) => { if (e.code === "Space") { e.preventDefault(); onHoldStart(); } }}
        onKeyUp={(e) => { if (e.code === "Space") { e.preventDefault(); onHoldEnd(); } }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 0",
          flexShrink: 0,
          transform: "scale(2.0)",
          transformOrigin: "center center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <UFigure state={figureState} />
      </div>

      {/* BOTTOM INPUT */}
      <div className="no-record" style={{
        padding: "10px 0 24px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <div style={{ borderTop: "1px solid var(--border)" }} />
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "13px",
          padding: "9px 13px",
          opacity: disabled ? 0.4 : 1,
        }}>
          <textarea
            ref={inputRef}
            rows={inputRows}
            placeholder={placeholder ?? "[say something…]"}
            aria-label="say something"
            className="no-record us-textarea"
            disabled={!!disabled}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 110) + "px";
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
            disabled={!!disabled}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(196,151,74,0.14)",
              cursor: disabled ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          by talking to [u], an AI, you agree to our{" "}
          <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>[terms]</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>[privacy policy]</a>
        </div>
      </div>
    </div>
  );
}
