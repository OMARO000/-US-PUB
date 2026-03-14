"use client";
import { useState } from "react";
import ChatHeader from "./ChatHeader";
import ModeTabs from "./ModeTabs";
import TalkMode from "./TalkMode";
import TextMode from "./TextMode";

interface Message {
  role: "them" | "user";
  text: string;
  time: string;
}

const SEED_MESSAGES: Message[] = [
  { role: "them", text: "Something brought you here. What was it?", time: "just now" },
];

export default function ChatInterface() {
  const [mode, setMode] = useState<"talk" | "text">("talk");
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);

  const handleStartRecording = () => setIsRecording(true);

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsLocked(false);
  };

  const handleLock = () => setIsLocked(true);

  const handleSend = (text: string) => {
    setMessages(prev => [...prev, {
      role: "user",
      text,
      time: "just now",
    }]);
  };

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--bg)",
      overflow: "hidden",
    }}>
      <ChatHeader mode={mode} isRecording={isRecording} isLocked={isLocked} />
      <ModeTabs mode={mode} onSwitch={(m) => { setMode(m); setIsRecording(false); setIsLocked(false); }} />

      {mode === "talk" ? (
        <TalkMode
          isRecording={isRecording}
          isLocked={isLocked}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onLock={handleLock}
        />
      ) : (
        <TextMode messages={messages} onSend={handleSend} />
      )}

      {mode === "talk" && (
        <div style={{
          padding: "14px 18px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            letterSpacing: "0.06em",
          }}>
            [hold anywhere above to speak]
          </span>
        </div>
      )}
    </div>
  );
}
