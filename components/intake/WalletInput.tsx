"use client"

/**
 * WalletInput
 *
 * Shown in the portrait delivery flow when user taps [mint portrait].
 * User can enter their Solana wallet address or use a custodial wallet.
 * Custodial wallet is generated server-side — user can export later from [profile].
 */

import { useState } from "react"

interface Props {
  onSubmit: (walletAddress: string | null) => void  // null = use custodial
  onCancel: () => void
}

export default function WalletInput({ onSubmit, onCancel }: Props) {
  const [address, setAddress] = useState("")
  const [mode, setMode] = useState<"enter" | "custodial">("enter")

  const isValidSolana = (addr: string) =>
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim())

  const handleSubmit = () => {
    if (mode === "custodial") {
      onSubmit(null)
    } else if (isValidSolana(address)) {
      onSubmit(address.trim())
    }
  }

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "20px",
      borderRadius: "14px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        fontWeight: 300,
        lineHeight: 1.7,
      }}>
        where should we send your portrait?
      </div>

      {/* Mode toggle */}
      <div style={{
        display: "flex",
        gap: "8px",
      }}>
        <button
          onClick={() => setMode("enter")}
          style={{
            flex: 1,
            height: "36px",
            borderRadius: "8px",
            background: mode === "enter" ? "var(--bg3)" : "transparent",
            border: `1px solid ${mode === "enter" ? "var(--amber)" : "var(--border)"}`,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: mode === "enter" ? "var(--amber)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          [my wallet]
        </button>
        <button
          onClick={() => setMode("custodial")}
          style={{
            flex: 1,
            height: "36px",
            borderRadius: "8px",
            background: mode === "custodial" ? "var(--bg3)" : "transparent",
            border: `1px solid ${mode === "custodial" ? "var(--amber)" : "var(--border)"}`,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: mode === "custodial" ? "var(--amber)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          [create one for me]
        </button>
      </div>

      {mode === "enter" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="[solana wallet address...]"
            aria-label="solana wallet address"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--bg)",
              border: `1px solid ${address && !isValidSolana(address) ? "var(--rose)" : "var(--border)"}`,
              outline: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text)",
              fontWeight: 300,
            }}
          />
          {address && !isValidSolana(address) && (
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--rose)",
              opacity: 0.8,
            }}>
              [that doesn't look like a valid Solana address]
            </div>
          )}
        </div>
      )}

      {mode === "custodial" && (
        <div style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          lineHeight: 1.7,
        }}>
          [us] will create a wallet for you. your portrait will be held there. you can export the wallet keys from [profile] at any time — it's always yours.
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleSubmit}
          disabled={mode === "enter" && !isValidSolana(address)}
          aria-label="confirm wallet and mint"
          style={{
            flex: 1,
            height: "44px",
            borderRadius: "10px",
            background: (mode === "custodial" || isValidSolana(address))
              ? "var(--amber)"
              : "var(--bg3)",
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: (mode === "custodial" || isValidSolana(address))
              ? "var(--bg)"
              : "var(--dim)",
            cursor: (mode === "custodial" || isValidSolana(address))
              ? "pointer"
              : "default",
            transition: "all 0.15s",
          }}
        >
          [mint portrait]
        </button>
        <button
          onClick={onCancel}
          aria-label="cancel"
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
          }}
        >
          [cancel]
        </button>
      </div>
    </div>
  )
}
