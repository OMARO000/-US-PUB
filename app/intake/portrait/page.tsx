"use client"

/**
 * /intake/portrait — Block 8 portrait delivery page
 *
 * Shown after intake session completes.
 * Receives portrait data via URL params or session storage.
 * Renders PortraitReveal component.
 * On confirmation → saves to DB → redirects to /connections.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PortraitReveal from "@/components/intake/PortraitReveal"

interface PortraitData {
  portraitText: string
  metaphorText: string
  imageKey: string
  archetype: string
  sessionId: string
}

export default function PortraitPage() {
  const router = useRouter()
  const [portrait, setPortrait] = useState<PortraitData | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintTxUrl, setMintTxUrl] = useState<string | undefined>()

  // load portrait data from session storage
  // set by the intake chat route when Block 8 completes
  useEffect(() => {
    if (typeof window === "undefined") return

    const raw = sessionStorage.getItem("us_portrait")
    if (!raw) {
      // no portrait data — redirect back to conversation
      router.replace("/conversation")
      return
    }

    try {
      const data = JSON.parse(raw) as PortraitData
      setPortrait(data)
    } catch {
      router.replace("/conversation")
    }
  }, [router])

  const handleConfirm = async (correction?: string) => {
    if (!portrait) return

    try {
      // save portrait confirmation to DB
      await fetch("/api/intake/portrait/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: portrait.sessionId,
          confirmed: true,
          correction: correction ?? null,
        }),
      })
    } catch {
      // non-blocking — portrait is already saved, confirmation is best-effort
    }
  }

  const handleMint = async (walletAddress: string | null) => {
    if (!portrait) return
    setIsMinting(true)

    try {
      const res = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: portrait.sessionId,
          imageKey: portrait.imageKey,
          archetype: portrait.archetype,
          ...(walletAddress !== null && { walletAddress }),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMintTxUrl(data.txUrl)
      }
    } catch {
      // mint failed silently — user can retry later from profile
    } finally {
      setIsMinting(false)
    }
  }

  if (!portrait) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          [preparing your portrait...]
        </span>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
    }}>
      <PortraitReveal
        portraitText={portrait.portraitText}
        metaphorText={portrait.metaphorText}
        imageKey={portrait.imageKey}
        archetype={portrait.archetype}
        onConfirm={handleConfirm}
        onMint={handleMint}
        isMinting={isMinting}
        mintTxUrl={mintTxUrl}
      />
    </div>
  )
}
