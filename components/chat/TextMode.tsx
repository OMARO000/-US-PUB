"use client";
import { useRef } from "react";

interface Message {
  role: "them" | "user";
  text: string;
  time: string;
}

interface TextModeProps {
  messages: Message[];
  onSend: (text: string) => void;
}

export default function TextMode({ messages, onSend }: TextModeProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    <>
      {/* messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        scrollbarWidth: "none",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
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
      </div>

      {/* input */}
      <div style={{
        padding: "14px 18px 18px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}>
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
    </>
  );
}
