"use client";
import { useRef } from "react";
import AmbientOrb from "./AmbientOrb";
import SlideLock from "./SlideLock";
interface Message {
  role: "them" | "user";
  text: string;
  time: string;
}
interface UnifiedChatProps {
  messages: Message[];
  isRecording: boolean;
  isLocked: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLock: () => void;
  onSend: (text: string) => void;
}
export default function UnifiedChat({
  messages, isRecording, isLocked,
  onStartRecording, onStopRecording, onLock, onSend
}: UnifiedChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 1;
  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text) return;
    onSend(text);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes hintpulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        onMouseDown={() => { if (!isLocked && !inputRef.current?.contains(document.activeElement)) onStartRecording(); }}
        onMouseUp={() => { if (!isLocked) onStopRecording(); }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".no-record")) return;
          e.preventDefault();
          if (!isLocked) onStartRecording();
        }}
        onTouchEnd={() => { if (!isLocked) onStopRecording(); }}
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
        {(!hasMessages || isRecording) && (
          <div style={{
            position: hasMessages ? "absolute" : "relative",
            top: hasMessages ? "50%" : "auto",
            left: hasMessages ? "50%" : "auto",
            transform: hasMessages ? "translate(-50%, -50%)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            alignSelf: "center",
            marginTop: hasMessages ? 0 : "auto",
            marginBottom: hasMessages ? 0 : "auto",
            flex: hasMessages ? "none" : 1,
            justifyContent: "center",
          }}>
            <AmbientOrb isRecording={isRecording} />
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="no-record" style={{
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
              {msg.text}
            </div>
            <div style={{
              fontSize: "10px",
              color: "var(--dim)",
              padding: "0 4px",
              textAlign: msg.role === "user" ? "right" : "left",
              fontFamily: "var(--font-mono)",
            }}>
              [{msg.time}]
            </div>
          </div>
        ))}
        {isRecording && !isLocked && (
          <div className="no-record" style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
          }}>
            <SlideLock onLock={onLock} />
          </div>
        )}
        {isLocked && (
          <div className="no-record" style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "20px",
            background: "rgba(196,151,74,0.1)",
            border: "1px solid rgba(196,151,74,0.22)",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "var(--amber)",
              animation: "recpulse 1s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.05em",
            }}>
              [recording locked]
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onStopRecording(); }}
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--muted)",
                background: "transparent",
                border: "1px solid var(--border2)",
                borderRadius: "12px",
                padding: "3px 10px",
                cursor: "pointer",
              }}
            >
              [done]
            </button>
          </div>
        )}
      </div>
      <div className="no-record" style={{
        padding: "12px 18px 18px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <div style={{
          textAlign: "center",
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "rgba(196,151,74,0.3)",
          letterSpacing: "0.1em",
        }}>
          [or type below]
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "13px",
          padding: "9px 13px",
        }}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="[say something…]"
            className="no-record"
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
              fontSize: "13.5px",
              fontWeight: 300,
              color: "var(--text)",
              fontFamily: "var(--font-sans)",
              resize: "none",
              lineHeight: 1.5,
            }}
          />
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleSend}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(196,151,74,0.14)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
