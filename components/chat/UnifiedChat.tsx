"use client";
import { useRef, useState, useEffect } from "react";
import UFigure from "@/components/UFigure";

const BUBBLE_PROMPTS = [
  "what brings you here?",
  "say whatever's true right now.",
  "start anywhere.",
  "what are you looking for?",
  "what's on your mind?",
  "something brought you here.",
  "what do you want to say?",
  "where do you want to begin?",
  "what matters to you right now?",
  "what are you hoping for?",
  "say the thing you haven't said yet.",
  "what would you want someone to know about you?",
  "what kind of connection are you looking for?",
  "what does a good day look like for you?",
  "what are you in the middle of right now?",
  "what do you protect?",
  "what do you give in relationships?",
  "what do you need but rarely ask for?",
  "what's something you're figuring out?",
  "what would you want [u] to know first?",
  "where are you going?",
  "what does connection mean to you?",
  "what kind of person do you resonate with?",
  "what are you building toward?",
  "what do you tend to notice first about someone?",
  "what do you wish people understood about you?",
  "what's been on your mind lately?",
  "what would you say if you knew it would land?",
  "what are you ready for?",
  "what's something you've never quite named?",
  "what does depth mean to you?",
  "just say something true.",
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

  // ── Cycling typewriter ────────────────────────────────────────────────────
  const [typedText, setTypedText] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptIndexRef = useRef(Math.floor(Math.random() * BUBBLE_PROMPTS.length));
  const charIndexRef = useRef(0);
  const phaseRef = useRef<"typing" | "holding" | "deleting" | "pausing">("typing");

  useEffect(() => {
    if (hasMessages) return;

    promptIndexRef.current = Math.floor(Math.random() * BUBBLE_PROMPTS.length);
    charIndexRef.current = 0;
    phaseRef.current = "typing";
    setTypedText("");

    const tick = () => {
      const prompt = BUBBLE_PROMPTS[promptIndexRef.current];

      if (phaseRef.current === "typing") {
        if (charIndexRef.current < prompt.length) {
          charIndexRef.current++;
          setTypedText(prompt.slice(0, charIndexRef.current));
          timerRef.current = setTimeout(tick, 40 + Math.random() * 20);
        } else {
          phaseRef.current = "holding";
          timerRef.current = setTimeout(tick, 2500);
        }
      } else if (phaseRef.current === "holding") {
        phaseRef.current = "deleting";
        tick();
      } else if (phaseRef.current === "deleting") {
        if (charIndexRef.current > 0) {
          charIndexRef.current--;
          setTypedText(prompt.slice(0, charIndexRef.current));
          timerRef.current = setTimeout(tick, 22);
        } else {
          phaseRef.current = "pausing";
          timerRef.current = setTimeout(tick, 400);
        }
      } else {
        // pausing — advance to next prompt
        promptIndexRef.current = (promptIndexRef.current + 1) % BUBBLE_PROMPTS.length;
        charIndexRef.current = 0;
        phaseRef.current = "typing";
        tick();
      }
    };

    timerRef.current = setTimeout(tick, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [hasMessages]);

  const figureState = (isRecording || isLocked) ? "listening" as const
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

  // ── EMPTY STATE — 3-zone horizontal layout (2× scale) ────────────────────
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
          <div style={{ display: "flex", alignItems: "center", gap: "48px", width: "100%", maxWidth: "900px" }}>

            {/* ── Left zone: figure + hold box ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
              <div
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
                style={{ cursor: "pointer", userSelect: "none", WebkitUserSelect: "none" }}
              >
                <UFigure state={figureState} scale={2} />
              </div>
              {figureState !== "listening" && <div className="us-hold-box" style={{
                width: "180px",
                marginTop: "-76px",
                background: "rgba(196,151,74,0.12)",
                border: "0.5px solid rgba(196,151,74,0.5)",
                borderRadius: "7px",
                padding: "12px 16px",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: "12px",
                color: "#C4974A",
                letterSpacing: "0.09em",
                lineHeight: 1.9,
                textAlign: "center",
                boxSizing: "border-box",
              }}>
                [hold me]<br/>[to speak]
              </div>}
            </div>

            {/* ── Dots — head of idle figure at (32/130)*260 ≈ 64px from top ── */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignSelf: "flex-start",
              paddingTop: "64px",
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="us-dot-1 us-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#C4974A", margin: "0 8px", flexShrink: 0 }} />
                <div className="us-dot-2 us-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#C4974A", margin: "0 8px", flexShrink: 0 }} />
                <div className="us-dot-3 us-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#C4974A", margin: "0 8px", flexShrink: 0 }} />
              </div>
            </div>

            {/* ── Right zone: bubble + input + disclaimer ── */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              minWidth: "448px",
              maxWidth: "520px",
              width: "100%",
              flex: 1,
            }}>
              {/* Cycling typewriter bubble */}
              <div className="us-bubble" style={{
                width: "100%",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "24px 32px",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: "14px",
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.04em",
                lineHeight: 1.65,
                minHeight: "64px",
              }}>
                {typedText}<span className="us-cursor">|</span>
              </div>

              {/* Input + send */}
              <div className="no-record us-chatbox" style={{
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(196,151,74,0.22)",
                borderRadius: "14px",
                padding: "24px 32px",
                opacity: disabled ? 0.4 : 1,
              }}>
                <textarea
                  ref={inputRef}
                  rows={inputRows}
                  placeholder="conversing with [u] starts with you..."
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
                    t.style.height = Math.min(t.scrollHeight, 200) + "px";
                  }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "var(--text)",
                    fontFamily: "var(--font-mono)",
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
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(196,151,74,0.14)",
                    cursor: disabled ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>

              {/* Disclaimer */}
              <div style={{
                fontSize: "10px",
                fontFamily: "IBM Plex Mono, monospace",
                color: "var(--muted)",
                opacity: 0.6,
                lineHeight: 1.6,
                letterSpacing: "0.03em",
                textAlign: "center",
              }}>
                by talking to [u], an AI, you agree to our{" "}
                <a href="/terms" style={{ color: "#C4974A", textDecoration: "none" }}>[terms]</a>
                {" "}and{" "}
                <a href="/privacy" style={{ color: "#C4974A", textDecoration: "none" }}>[privacy policy]</a>
              </div>
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
