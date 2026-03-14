import Sidebar from "@/components/sidebar/Sidebar";

export default function ConversationPage() {
  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ marginLeft: "64px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ color: "var(--dim)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "24px" }}>
          [conversation]
        </div>
      </main>
    </div>
  );
}
