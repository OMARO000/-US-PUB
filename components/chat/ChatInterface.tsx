"use client";
import { useState } from "react";
import ChatHeader from "./ChatHeader";
import UnifiedChat from "./UnifiedChat";

interface Message {
  role: "them" | "user";
  text: string;
  time: string;
}

const SEED_MESSAGES: Message[] = [
  { role: "them", text: "Something brought you here. What was it?", time: "just now" },
];

export default function ChatInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);

  const handleStartRecording = () => setIsRecording(true);
  const handleStopRecording = () => { setIsRecording(false); setIsLocked(false); };
  const handleLock = () => setIsLocked(true);
  const handleSend = (text: string) => {
    setMessages(prev => [...prev, { role: "user", text, time: "just now" }]);
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
        isLocked={isLocked}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onLock={handleLock}
        onSend={handleSend}
      />
    </div>
  );
}
