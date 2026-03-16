"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

export default function ProfilePage() {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{
        marginLeft: "220px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
      }}>
        <YouNarrationBanner narration={narration} />
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}>
          <div style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
          }}>
            [profile]
          </div>
        </div>
      </main>
    </div>
  )
}
