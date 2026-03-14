import Sidebar from "@/components/sidebar/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";

export default function ConversationPage() {
  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ marginLeft: "64px", flex: 1, display: "flex" }}>
        <ChatInterface />
      </main>
    </div>
  );
}
