"use client"

/**
 * /us-plus — [modes] pricing
 * [open] · [shared] · [sovereign]
 */

import { useState } from "react"

const MODES = [
  {
    id: "open",
    label: "[open]",
    price: "free",
    description: "the full [us] experience. unlimited matching, unlimited conversation with [u], your portrait, your connections.",
    features: [
      "intake + portrait generation",
      "unlimited matching",
      "7-layer match engine",
      "connections + matched conversations",
      "journal + insights",
      "[u] across all threads",
    ],
    note: "always free. no expiration.",
    amber: false,
  },
  {
    id: "shared",
    label: "[shared]",
    price: "$10 / month",
    description: "you contribute anonymized data to the [us] research commons. in return, you get deeper connection intelligence and help build something that benefits everyone.",
    features: [
      "everything in [open]",
      "4 additional match engine layers",
      "[go deeper] matching mode",
      "pattern recognition across connections",
      "pre-meet preparation with [u]",
      "post-connect debriefs",
      "framework visibility — see how [u] sees you",
      "data co-op contributor status",
    ],
    note: "your data is anonymized, consented, and never sold. it funds research into human connection.",
    amber: true,
  },
  {
    id: "sovereign",
    label: "[sovereign]",
    price: "$20 / month",
    description: "all the depth of [shared], with complete data sovereignty. nothing leaves your account. ever.",
    features: [
      "everything in [shared]",
      "zero data contribution — your data stays yours",
      "NFT portrait mint included",
      "priority matching",
      "early access to new features",
    ],
    note: "for those who want depth without compromise.",
    amber: false,
  },
]

export default function UsPlusPage({ embedded }: { embedded?: boolean } = {}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{
      flex: 1,
      width: "100%",
      maxWidth: "640px",
      margin: "0 auto",
      padding: embedded ? "24px 20px 60px" : "40px 20px 60px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      overflowY: "auto",
      height: "100%",
    }}>
      {/* header */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--text)",
          letterSpacing: "0.04em",
          marginBottom: "8px",
        }}>
          [us plus]
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--muted)",
          fontWeight: 300,
          lineHeight: 1.7,
          opacity: 0.7,
        }}>
          choose how you want to be part of [us]. all modes include the full platform — the difference is depth and data.
        </div>
      </div>

      {/* mode cards */}
      {MODES.map((mode) => (
        <div
          key={mode.id}
          onClick={() => setSelected(mode.id)}
          style={{
            border: `1px solid ${selected === mode.id ? "var(--amber)" : mode.amber ? "var(--amber)" : "var(--border)"}`,
            borderRadius: "13px",
            background: selected === mode.id ? "rgba(196,151,74,0.06)" : "var(--bg2)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          {/* mode header */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "15px",
              color: mode.amber ? "var(--amber)" : "var(--text)",
              letterSpacing: "0.04em",
            }}>
              {mode.label}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: mode.amber ? "var(--amber)" : "var(--muted)",
              letterSpacing: "0.04em",
            }}>
              {mode.price}
            </span>
          </div>

          {/* description */}
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text)",
            fontWeight: 300,
            lineHeight: 1.75,
          }}>
            {mode.description}
          </div>

          {/* features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {mode.features.map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: mode.amber ? "var(--amber)" : "var(--muted)",
                  opacity: 0.7,
                  flexShrink: 0,
                  marginTop: "1px",
                }}>
                  —
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--muted)",
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* note */}
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            opacity: 0.5,
            lineHeight: 1.6,
            borderTop: "1px solid var(--border)",
            paddingTop: "10px",
          }}>
            {mode.note}
          </div>

          {/* CTA */}
          {mode.id !== "open" && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(mode.id) }}
              style={{
                height: "44px",
                borderRadius: "10px",
                background: selected === mode.id ? "var(--amber)" : mode.amber ? "var(--amber)" : "transparent",
                border: selected === mode.id ? "none" : mode.amber ? "none" : "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: selected === mode.id || mode.amber ? "var(--bg)" : "var(--muted)",
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "background 0.15s",
              }}
            >
              {selected === mode.id ? "[selected — coming soon]" : "[coming soon]"}
            </button>
          )}
        </div>
      ))}

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--muted)",
        opacity: 0.4,
        lineHeight: 1.6,
        textAlign: "center",
        marginTop: "8px",
      }}>
        payments via Stripe · sovereign by design · OMARO PBC
      </div>
    </div>
  )
}
