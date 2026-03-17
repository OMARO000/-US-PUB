"use client"

/**
 * /connections — match delivery UI
 *
 * Card-based. All matches visible, scroll through.
 * No compatibility scores — resonance signals only.
 * Free users: 3 resonance signals per match
 * Paid users: up to 8 signals + deeper layer visibility + "go deeper" toggle
 *
 * [you] narrates on entry.
 * Match cards show: archetype image, resonance signals, connection type, action buttons.
 */

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ConnectionType = "romantic" | "platonic" | "professional" | "open"
type MatchStatus = "new" | "pending" | "connected" | "not_a_fit"

interface ResonanceSignal {
  text: string
  layer: string      // which framework layer this came from
  isPaid: boolean    // paid-only signals shown locked to free users
}

interface Match {
  id: string
  initials: string           // anonymous — no names until both connect
  archetype: string          // their portrait archetype
  archetypeImageKey: string  // maps to artwork library
  connectionType: ConnectionType
  status: MatchStatus
  resonanceSignals: ResonanceSignal[]
  mutualSignals: string[]    // what you both share — shown to both
  timeAgo: string
  goDeeper?: boolean         // paid: has user activated go deeper for this match
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatTimeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

function initialsFromId(id: string): string {
  return id.slice(0, 1).toUpperCase()
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function ConnectionTypeBadge({ type }: { type: ConnectionType }) {
  const labels: Record<ConnectionType, string> = {
    romantic: "[romantic]",
    platonic: "[platonic]",
    professional: "[professional]",
    open: "[open]",
  }
  const colors: Record<ConnectionType, string> = {
    romantic: "var(--rose)",
    platonic: "var(--amber)",
    professional: "var(--muted)",
    open: "var(--muted)",
  }
  return (
    <span style={{
      fontSize: "10px",
      fontFamily: "var(--font-mono)",
      color: colors[type],
      letterSpacing: "0.05em",
      opacity: 0.8,
    }}>
      {labels[type]}
    </span>
  )
}

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "new") return (
    <span style={{
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: "var(--rose)",
      display: "inline-block",
      flexShrink: 0,
    }} />
  )
  if (status === "pending") return (
    <span style={{
      fontSize: "10px",
      fontFamily: "var(--font-mono)",
      color: "var(--amber)",
      opacity: 0.7,
    }}>
      [waiting]
    </span>
  )
  return null
}

function ArchetypeAvatar({ initials, archetype }: { initials: string; archetype: string }) {
  const archetypeColors: Record<string, string> = {
    rooted: "#3A4D3A",
    horizon: "#2A3D4D",
    intimate: "#4D3A3A",
    current: "#3A3D2A",
    liminal: "#3A3A4D",
    celestial: "#2A2A3D",
    composite: "#3D3A2A",
  }

  return (
    <div style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: archetypeColors[archetype] ?? "var(--bg3)",
      border: "1px solid var(--border2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontFamily: "var(--font-mono)",
      color: "var(--muted)",
      fontWeight: 300,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function ResonanceSignalRow({ signal, index }: { signal: ResonanceSignal; index: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      opacity: signal.isPaid ? 0.4 : 1,
      position: "relative",
    }}>
      <span style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--amber)",
        opacity: 0.5,
        paddingTop: "2px",
        flexShrink: 0,
        minWidth: "16px",
      }}>
        {index + 1}.
      </span>
      <span style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
        lineHeight: 1.6,
        flex: 1,
      }}>
        {signal.text}
      </span>
      {signal.isPaid && (
        <span style={{
          fontSize: "9px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          opacity: 0.6,
          flexShrink: 0,
          paddingTop: "2px",
        }}>
          [paid]
        </span>
      )}
    </div>
  )
}

function MutualSignals({ signals }: { signals: string[] }) {
  if (!signals.length) return null
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: "8px",
      background: "var(--bg)",
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}>
      <div style={{
        fontSize: "9px",
        fontFamily: "var(--font-mono)",
        color: "var(--amber)",
        letterSpacing: "0.08em",
        opacity: 0.7,
      }}>
        [what you share]
      </div>
      {signals.map((s, i) => (
        <div key={i} style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
          lineHeight: 1.5,
        }}>
          — {s}
        </div>
      ))}
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<MatchStatus>(match.status)

  async function recordAction(action: "connected" | "not_a_fit") {
    setStatus(action === "connected" ? "pending" : "not_a_fit")
    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, action }),
      })
    } catch {
      // silent — local state already updated
    }
  }

  const visibleSignals = expanded
    ? match.resonanceSignals
    : match.resonanceSignals.slice(0, 3)

  if (status === "not_a_fit") return null

  return (
    <div style={{
      borderRadius: "14px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>

      {/* Card header */}
      <div style={{
        padding: "16px 16px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}>
        <ArchetypeAvatar initials={match.initials} archetype={match.archetype} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}>
            <span style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              fontWeight: 400,
            }}>
              [{match.initials}]
            </span>
            <StatusBadge status={status} />
            <span style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              marginLeft: "auto",
            }}>
              {match.timeAgo}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ConnectionTypeBadge type={match.connectionType} />
            <span style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              opacity: 0.6,
            }}>
              [{match.archetype}]
            </span>
          </div>
        </div>
      </div>

      {/* Resonance signals */}
      <div style={{
        padding: "0 16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        <div style={{
          fontSize: "9px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          letterSpacing: "0.08em",
          opacity: 0.7,
          marginBottom: "4px",
        }}>
          [what resonates]
        </div>
        {visibleSignals.map((signal, i) => (
          <ResonanceSignalRow key={i} signal={signal} index={i} />
        ))}
        {!expanded && match.resonanceSignals.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              padding: "4px 0",
              textAlign: "left",
              opacity: 0.7,
            }}
          >
            [{match.resonanceSignals.length - 3} more signals — expand]
          </button>
        )}
      </div>

      {/* Mutual signals */}
      {expanded && (
        <div style={{ padding: "0 16px 12px" }}>
          <MutualSignals signals={match.mutualSignals} />
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: "8px",
        alignItems: "center",
      }}>
        {status === "new" && (
          <>
            <button
              onClick={() => recordAction("connected")}
              aria-label="connect with this person"
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
                fontWeight: 400,
                letterSpacing: "0.03em",
              }}
            >
              [connect]
            </button>
            <button
              onClick={() => recordAction("not_a_fit")}
              aria-label="not a fit"
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
              }}
            >
              [not a fit]
            </button>
          </>
        )}
        {status === "pending" && (
          <div style={{
            flex: 1,
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            fontWeight: 300,
          }}>
            [waiting for them to connect]
          </div>
        )}
        {status === "connected" && (
          <button
            aria-label="start conversation"
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--amber)",
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            [start conversation]
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px",
      gap: "16px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        fontWeight: 300,
        lineHeight: 1.7,
        maxWidth: "340px",
      }}>
        no matches yet.
      </div>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
        lineHeight: 1.7,
        maxWidth: "340px",
      }}>
        complete your portrait in [conversation] and [you] will find people who resonate.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function ConnectionsPage() {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = typeof window !== "undefined"
      ? localStorage.getItem("us_uid")
      : null
    if (!userId) { setLoading(false); return }

    fetch(`/api/matches?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data.matches ?? []
        const mapped: Match[] = raw.map((m: {
          id: string
          targetUserId: string
          connectionType: ConnectionType
          resonanceSignals: string[]
          mutualSignals: string[]
          archetypeB: string | null
          status: string
          scoredAt: string | Date
        }) => ({
          id: m.id,
          initials: initialsFromId(m.targetUserId),
          archetype: m.archetypeB ?? "composite",
          archetypeImageKey: `${m.archetypeB ?? "composite"}_01`,
          connectionType: m.connectionType,
          status: (m.status === "shown" ? "new" : m.status) as MatchStatus,
          resonanceSignals: m.resonanceSignals.map((text, i) => ({
            text,
            layer: "signal",
            isPaid: i >= 3,
          })),
          mutualSignals: m.mutualSignals,
          timeAgo: formatTimeAgo(m.scoredAt),
        }))
        setMatches(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}>
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}>
              {loading ? "[loading...]" : `[${matches.length} ${matches.length === 1 ? "match" : "matches"}]`}
            </div>
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              fontWeight: 300,
            }}>
              [sorted by resonance]
            </div>
          </div>

          {/* Match cards */}
          {matches.length === 0 ? (
            <EmptyState />
          ) : (
            matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}

        </div>
      </main>
    </div>
  )
}
