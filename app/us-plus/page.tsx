"use client"

/**
 * /us-plus — [modes] pricing
 * [open] · [shared] · [sovereign] · [us] for two · [us] for family
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
      "limited sessions per month",
    ],
    note: "always free. no expiration.",
    amber: false,
    isFree: true,
  },
  {
    id: "shared",
    label: "[shared]",
    price: "$10 / month",
    description: "full personal access to everything [us] offers. your portrait grows deeper over time. your data stays yours — always.",
    features: [
      "everything in [open]",
      "unlimited sessions",
      "4 additional match engine layers",
      "[go deeper] matching mode",
      "pattern recognition across connections",
      "pre-meet preparation with [u]",
      "post-connect debriefs",
      "framework visibility — see how [u] sees you",
    ],
    note: "your data is never sold. it is used only to build better products for you and the public.",
    amber: true,
  },
  {
    id: "sovereign",
    label: "[sovereign]",
    price: "$20 / month",
    description: "the deepest relationship with [u]. your portrait evolves month over month. complete data sovereignty — nothing leaves your account, ever.",
    features: [
      "everything in [shared]",
      "deep portrait — tracks how you change over time",
      "memory exports — download your full history",
      "priority voice quality",
      "custom [u] name",
      "early access to new features — 30-60 days first",
      "direct product input channel",
      "NFT portrait mint included",
    ],
    note: "for those who want depth without compromise.",
    amber: false,
  },
  {
    id: "two",
    label: "[us] for two",
    price: "$18 / month",
    priceUpgrade: "+ $7 for [sovereign] access → $25 / month",
    description: "a private shared space for two people — partners, best friends, anyone who wants to grow together. each person keeps their private portrait. together you build a shared one.",
    features: [
      "two full [shared] accounts",
      "private shared space between both people",
      "shared portrait — reflects the relationship",
      "private threads between members",
      "matched conversation history",
      "upgrade either account to [sovereign] for +$7",
    ],
    note: "people-first. no workplace tools. no data sales. built for relationships.",
    amber: false,
  },
  {
    id: "family",
    label: "[us] for family",
    price: "$28 / month",
    priceUpgrade: "+ $7 for [sovereign] access → $35 / month",
    description: "a private shared space for up to 5 people. every member has their own portrait and private threads. together you build something that reflects all of you.",
    features: [
      "up to 5 full [shared] accounts",
      "private shared family space",
      "family portrait — evolves with everyone",
      "private threads between any two members",
      "shared insights across the group",
      "upgrade any account to [sovereign] for +$7",
    ],
    note: "private by design. your family's data belongs to your family.",
    amber: false,
  },
]

export default function UsPlusPage({ embedded }: { embedded?: boolean } = {}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{
      flex: 1,
      width: "100%",
      maxWidth: "720px",
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
          choose how you want to be part of [us]. all modes include the full platform — the difference is depth, data sovereignty, and who you bring with you.
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
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "15px",
              color: mode.amber ? "var(--amber)" : "var(--text)",
              letterSpacing: "0.04em",
            }}>
              {mode.label}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: mode.amber ? "var(--amber)" : "var(--muted)",
                letterSpacing: "0.04em",
              }}>
                {mode.price}
              </span>
              {"priceUpgrade" in mode && mode.priceUpgrade && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--muted)",
                  letterSpacing: "0.04em",
                  opacity: 0.6,
                }}>
                  {mode.priceUpgrade}
                </span>
              )}
            </div>
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

          {/* current mode indicator for open */}
          {mode.id === "open" && (
            <div style={{
              height: "44px",
              borderRadius: "10px",
              background: "rgba(196,151,74,0.06)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.04em",
              opacity: 0.6,
            }}>
              [your current mode]
            </div>
          )}

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
        payments via Stripe · sovereign by design · your data is never sold · OMARO PBC
      </div>
    </div>
  )
}
