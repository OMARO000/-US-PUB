"use client"

/**
 * PortraitReveal
 *
 * The Block 8 delivery moment.
 * 1. Image fades in slowly (2s)
 * 2. Written portrait streams in below — character by character
 * 3. Metaphor text lands after a pause — italicized, amber
 * 4. Confirmation prompt appears — user confirms, corrects, or adds
 * 5. NFT mint option appears after confirmation
 *
 * This is the most important moment in the first experience.
 * Unhurried. No buttons until the portrait has fully landed.
 */

import { useState, useEffect, useRef } from "react"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type PortraitRevealStage =
  | "idle"
  | "image_revealing"
  | "portrait_streaming"
  | "metaphor_landing"
  | "confirming"
  | "confirmed"
  | "minting"
  | "minted"

interface Props {
  portraitText: string
  metaphorText: string
  imageKey: string           // e.g. "horizon_02" — maps to /portraits/{imageKey}.jpg
  archetype: string
  onConfirm: (correction?: string) => void
  onMint: () => void
  isMinting?: boolean
  mintTxUrl?: string         // Solana explorer URL after mint
}

// ─────────────────────────────────────────────
// STREAMING TEXT HOOK
// ─────────────────────────────────────────────

function useStreamingText(text: string, active: boolean, speed: number = 18) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!active || !text) return
    indexRef.current = 0
    setDisplayed("")
    setDone(false)

    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        setDone(true)
        clearInterval(interval)
        return
      }
      const next = text.slice(0, indexRef.current + 1)
      setDisplayed(next)
      indexRef.current += 1
    }, speed)

    return () => clearInterval(interval)
  }, [text, active, speed])

  return { displayed, done }
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function PortraitReveal({
  portraitText,
  metaphorText,
  imageKey,
  archetype,
  onConfirm,
  onMint,
  isMinting = false,
  mintTxUrl,
}: Props) {
  const [stage, setStage] = useState<PortraitRevealStage>("idle")
  const [imageOpacity, setImageOpacity] = useState(0)
  const [metaphorVisible, setMetaphorVisible] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [showConfirmInput, setShowConfirmInput] = useState(false)
  const confirmRef = useRef<HTMLTextAreaElement>(null)

  // start sequence on mount
  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage("image_revealing")
      setImageOpacity(1)
    }, 300)

    const t2 = setTimeout(() => {
      setStage("portrait_streaming")
    }, 2500)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const portraitStreaming = useStreamingText(
    portraitText,
    stage === "portrait_streaming",
    20
  )

  // after portrait done, land the metaphor
  useEffect(() => {
    if (!portraitStreaming.done) return
    const t = setTimeout(() => {
      setStage("metaphor_landing")
      setMetaphorVisible(true)
    }, 800)
    return () => clearTimeout(t)
  }, [portraitStreaming.done])

  const metaphorStreaming = useStreamingText(
    metaphorText,
    stage === "metaphor_landing",
    25
  )

  // after metaphor done, show confirmation prompt
  useEffect(() => {
    if (!metaphorStreaming.done) return
    const t = setTimeout(() => {
      setStage("confirming")
    }, 1200)
    return () => clearTimeout(t)
  }, [metaphorStreaming.done])

  const handleConfirm = () => {
    setStage("confirmed")
    onConfirm(confirmInput.trim() || undefined)
  }

  const handleCorrect = () => {
    setShowConfirmInput(true)
    setTimeout(() => confirmRef.current?.focus(), 50)
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      maxWidth: "560px",
      margin: "0 auto",
      padding: "40px 20px 60px",
      gap: "0",
    }}>

      {/* Portrait image */}
      <div style={{
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: "16px",
        overflow: "hidden",
        opacity: imageOpacity,
        transition: "opacity 2s ease",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        marginBottom: "32px",
        position: "relative",
      }}>
        {/* Placeholder until artwork library is ready */}
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
        }}>
          <span style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            letterSpacing: "0.05em",
          }}>
            [{archetype}]
          </span>
          <span style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            opacity: 0.5,
          }}>
            {imageKey}
          </span>
        </div>
        {/* Real image — uncomment when artwork library is ready */}
        {/* <img
          src={`/portraits/${imageKey}.jpg`}
          alt={`your portrait — ${archetype}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        /> */}
      </div>

      {/* Written portrait */}
      {stage !== "idle" && stage !== "image_revealing" && (
        <div style={{
          width: "100%",
          fontSize: "15px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          lineHeight: 1.8,
          marginBottom: metaphorVisible ? "24px" : "0",
          minHeight: "120px",
        }}>
          {portraitStreaming.displayed}
          {!portraitStreaming.done && (
            <span style={{
              display: "inline-block",
              width: "7px",
              height: "15px",
              background: "var(--amber)",
              marginLeft: "2px",
              opacity: 0.7,
              animation: "blink 0.8s step-end infinite",
              verticalAlign: "text-bottom",
            }} />
          )}
        </div>
      )}

      {/* Metaphor text */}
      {metaphorVisible && (
        <div style={{
          width: "100%",
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          fontWeight: 300,
          lineHeight: 1.8,
          fontStyle: "italic",
          opacity: metaphorStreaming.displayed ? 1 : 0,
          transition: "opacity 0.3s",
          marginBottom: stage === "confirming" || stage === "confirmed" ? "32px" : "0",
        }}>
          {metaphorStreaming.displayed}
          {!metaphorStreaming.done && (
            <span style={{
              display: "inline-block",
              width: "7px",
              height: "14px",
              background: "var(--amber)",
              marginLeft: "2px",
              opacity: 0.7,
              animation: "blink 0.8s step-end infinite",
              verticalAlign: "text-bottom",
            }} />
          )}
        </div>
      )}

      {/* Confirmation prompt */}
      {stage === "confirming" && (
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "fadeIn 0.6s ease forwards",
        }}>
          <div style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            fontWeight: 300,
            lineHeight: 1.7,
          }}>
            does this land?
          </div>

          {showConfirmInput && (
            <textarea
              ref={confirmRef}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="[what would you change or add...]"
              aria-label="correct or add to your portrait"
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--bg2)",
                border: "1px solid var(--amber)",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--text)",
                fontWeight: 300,
                lineHeight: 1.6,
                resize: "none",
              }}
            />
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleConfirm}
              aria-label="confirm portrait"
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "10px",
                background: "var(--amber)",
                border: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--bg)",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              [this is me]
            </button>
            {!showConfirmInput && (
              <button
                onClick={handleCorrect}
                aria-label="correct or add to portrait"
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--muted)",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                [not quite]
              </button>
            )}
            {showConfirmInput && (
              <button
                onClick={handleConfirm}
                aria-label="save correction"
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--amber)",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                [save]
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post-confirmation — NFT mint option */}
      {stage === "confirmed" && !mintTxUrl && (
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "fadeIn 0.6s ease forwards",
        }}>
          <div style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            fontWeight: 300,
            lineHeight: 1.7,
          }}>
            your portrait is yours. you can mint it on Solana — a permanent record of who you were today.
          </div>
          <div style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            fontWeight: 300,
          }}>
            0.1–0.2 SOL · [us] by OMARO PBC
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setStage("minting"); onMint() }}
              disabled={isMinting}
              aria-label="mint portrait as NFT"
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "10px",
                background: isMinting ? "var(--bg3)" : "var(--bg2)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: isMinting ? "var(--dim)" : "var(--amber)",
                cursor: isMinting ? "default" : "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
              }}
            >
              {isMinting ? "[minting...]" : "[mint portrait]"}
            </button>
            <button
              onClick={() => setStage("minted")}
              aria-label="skip minting"
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "10px",
                background: "transparent",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--muted)",
                cursor: "pointer",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
            >
              [skip]
            </button>
          </div>
        </div>
      )}

      {/* Minted confirmation */}
      {(stage === "minted" || mintTxUrl) && (
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          animation: "fadeIn 0.6s ease forwards",
        }}>
          {mintTxUrl ? (
            <>
              <div style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--amber)",
                fontWeight: 300,
              }}>
                [portrait minted]
              </div>
              <a
                href={mintTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--muted)",
                  textDecoration: "none",
                  opacity: 0.7,
                }}
              >
                [view on Solana →]
              </a>
            </>
          ) : (
            <div style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              fontWeight: 300,
            }}>
              [portrait saved. your matches are being found.]
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
