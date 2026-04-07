"use client";
import { useState } from "react";
import ChatHeader from "./ChatHeader";
import UnifiedChat from "./UnifiedChat";

interface ChatMessage {
  id: string;
  role: "them" | "user";
  content: string;
  time: string;
}

const SEED_MESSAGES: ChatMessage[] = [
  { id: "seed-1", role: "them", content: "Something brought you here. What was it?", time: "just now" },
];

export default function ChatInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);

  const handleHoldStart = () => setIsRecording(true);
  const handleHoldEnd = () => { setIsRecording(false); };
  const handleToggleLock = () => setIsLocked(l => !l);
  const handleRephrase = () => {};
  const handleSendText = (text: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, time: "just now" }]);
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
      <ChatHeader mode="talk" isRecording={isRecording} isLocked={isLocked} />
      <UnifiedChat
        messages={messages}
        isRecording={isRecording}
        isThinking={false}
        isSpeaking={false}
        isLocked={isLocked}
        onHoldStart={handleHoldStart}
        onHoldEnd={handleHoldEnd}
        onToggleLock={handleToggleLock}
        onSendText={handleSendText}
        onRephrase={handleRephrase}
      />
    </div>
  );
}
