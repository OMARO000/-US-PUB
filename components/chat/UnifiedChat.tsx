"use client";
import { useRef } from "react";
import AmbientOrb from "./AmbientOrb";

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
}

export default function UnifiedChat({
  messages, isRecording, isThinking, isSpeaking,
  isLocked, onHoldStart, onHoldEnd, onToggleLock,
  onSendText, onRephrase, disabled = false,
  showMessages = true,
}: UnifiedChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0 && showMessages;

  const orbState = isRecording ? "recording" : isThinking ? "thinking" : isSpeaking ? "speaking" : "idle";

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    onSendText(text);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
  };

  // Body tap handlers — respect locked mode
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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes hintpulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .us-textarea:focus-visible {
          outline: 2px solid var(--amber) !important;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>

      {/* CHAT BODY — only rendered when showMessages is true */}
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
          {/* Orb overlay — while recording/thinking/speaking over messages */}
          {(isRecording || isThinking || isSpeaking) && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "none",
            }}>
              <AmbientOrb isRecording={isRecording} orbState={orbState} isLocked={isLocked} />
            </div>
          )}

          {/* Messages — aria-live so screen readers announce incoming [them] responses */}
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
                  padding: "11px 15px",
                  borderRadius: msg.role === "them" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
                  fontSize: "13.5px",
                  fontWeight: 300,
                  lineHeight: 1.65,
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

      {/* BOTTOM INPUT */}
      <div className="no-record" style={{
        padding: "14px 20px 20px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <div style={{
          textAlign: "center",
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "rgba(196,151,74,0.75)",
          letterSpacing: "0.1em",
        }}>
          [or type below]
        </div>
        <div style={{ borderTop: "1px solid var(--border)", margin: "0 -18px" }} />
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
            rows={1}
            placeholder="[say something…]"
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
              fontSize: "15px",
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
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          opacity: 0.6,
          lineHeight: 1.5,
        }}>
          by talking to [you], an AI, you agree to our{" "}
          <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>[terms]</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>[privacy policy]</a>
        </div>
      </div>
    </div>
  );
}
