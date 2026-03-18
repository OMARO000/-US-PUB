"use client"

/**
 * /connections — match delivery UI
 */

import { useState, useEffect, useCallback } from "react"

type ConnectionType = "romantic" | "platonic" | "professional" | "open"
type MatchStatus = "pending" | "connected" | "not_a_fit" | "shown"

interface ResonanceSignal { text: string; isPaid: boolean }
interface Match {
  id: string
  targetUserId: string
  archetypeA: string
  archetypeB: string
  connectionType: ConnectionType
  status: MatchStatus
  totalScore: number
  resonanceSignals: ResonanceSignal[]
  mutualSignals: string[]
  scoredAt: string
}
interface MutualResult { matchId: string; conversationId: string; firstPrompt: string }

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anon"
  const key = "us_uid"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = `anon_${crypto.randomUUID()}`
  localStorage.setItem(key, id)
  return id
}

function initialsFromId(id: string): string {
  return id.replace(/^anon_/, "").slice(0, 2).toUpperCase()
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ARCHETYPE_COLORS: Record<string, string> = {
  rooted:    "rgba(80,160,100,0.18)",
  horizon:   "rgba(196,151,74,0.18)",
  intimate:  "rgba(168,88,96,0.18)",
  current:   "rgba(200,120,60,0.18)",
  liminal:   "rgba(100,140,200,0.18)",
  celestial: "rgba(130,100,200,0.18)",
  composite: "rgba(196,151,74,0.12)",
}

function ArchetypeAvatar({ archetype, initials }: { archetype: string; initials: string }) {
  return (
    <div style={{
      width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
      background: ARCHETYPE_COLORS[archetype] ?? ARCHETYPE_COLORS.composite,
      border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em" }}>
        {initials}
      </span>
    </div>
  )
}

function ResonanceSignalRow({ signal }: { signal: ResonanceSignal }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: signal.isPaid ? 0.45 : 1, filter: signal.isPaid ? "blur(3px)" : "none", userSelect: signal.isPaid ? "none" : "auto" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: signal.isPaid ? "var(--border)" : "var(--amber)", flexShrink: 0, opacity: 0.7 }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", fontWeight: 300, lineHeight: 1.5 }}>
        {signal.text}
      </span>
    </div>
  )
}

function MatchCard({ match, onConnect, onNotAFit, mutual, isActing }: {
  match: Match; onConnect: (id: string) => void; onNotAFit: (id: string) => void
  mutual: MutualResult | null; isActing: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const initials = initialsFromId(match.targetUserId)
  const freeSignals = match.resonanceSignals.filter((s) => !s.isPaid)
  const pulseColor = freeSignals.length >= 3 ? "var(--amber)" : freeSignals.length >= 2 ? "rgba(196,151,74,0.5)" : "var(--border)"
  const isConnected = match.status === "connected"
  const isNotFit = match.status === "not_a_fit"

  return (
    <div style={{ border: `1px solid ${expanded ? pulseColor : "var(--border)"}`, borderRadius: "13px", background: "var(--bg2)", overflow: "hidden", transition: "border-color 0.2s", opacity: isNotFit ? 0.4 : 1 }}>
      <button onClick={() => setExpanded((p) => !p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <ArchetypeAvatar archetype={match.archetypeB ?? "composite"} initials={initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text)", letterSpacing: "0.04em", marginBottom: "3px" }}>
            [{match.archetypeB ?? "composite"}]
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.03em" }}>
            {freeSignals.length} signal{freeSignals.length !== 1 ? "s" : ""} · {formatTimeAgo(match.scoredAt)}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: isConnected ? "var(--amber)" : "var(--muted)", letterSpacing: "0.04em", flexShrink: 0 }}>
          {isConnected ? "[connected]" : isNotFit ? "[passed]" : expanded ? "[−]" : "[+]"}
        </div>
      </button>

      {expanded && !isNotFit && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {match.resonanceSignals.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {match.resonanceSignals.map((s, i) => <ResonanceSignalRow key={i} signal={s} />)}
              {match.resonanceSignals.some((s) => s.isPaid) && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.5, marginTop: "2px" }}>
                  [go deeper] unlocks all signals
                </div>
              )}
            </div>
          )}

          {match.mutualSignals.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {match.mutualSignals.map((s, i) => (
                <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 8px", letterSpacing: "0.03em" }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {mutual && (
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--amber)", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text)", fontWeight: 300, lineHeight: 1.65 }}>
              {mutual.firstPrompt}
            </div>
          )}

          {!isConnected && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => onConnect(match.id)} disabled={isActing} style={{ flex: 1, height: "40px", borderRadius: "9px", background: "rgba(196,151,74,0.12)", border: "1px solid var(--amber)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--amber)", cursor: isActing ? "default" : "pointer", letterSpacing: "0.04em", opacity: isActing ? 0.5 : 1, transition: "opacity 0.15s" }}>
                [connect]
              </button>
              <button onClick={() => onNotAFit(match.id)} disabled={isActing} style={{ height: "40px", padding: "0 14px", borderRadius: "9px", background: "transparent", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", cursor: isActing ? "default" : "pointer", letterSpacing: "0.04em", opacity: isActing ? 0.5 : 1, whiteSpace: "nowrap", transition: "opacity 0.15s" }}>
                [not a fit]
              </button>
            </div>
          )}

          {mutual && (
            <a href={`/conversation?c=${mutual.conversationId}`} style={{ height: "40px", borderRadius: "9px", background: "var(--amber)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--bg)", letterSpacing: "0.04em", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              [open conversation]
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ noPortrait }: { noPortrait: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "20vh", gap: "12px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.7, maxWidth: "280px" }}>
        {noPortrait ? "[your portrait isn't ready yet. finish your conversation with [them] first.]" : "[no matches yet. check back soon.]"}
      </span>
      {noPortrait && (
        <a href="/conversation" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--amber)", textDecoration: "none", letterSpacing: "0.04em" }}>
          [go to [them] →]
        </a>
      )}
    </div>
  )
}

export default function ConnectionsPage({ embedded }: { embedded?: boolean } = {}) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [noPortrait, setNoPortrait] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [mutuals, setMutuals] = useState<Record<string, MutualResult>>({})

  const fetchMatches = useCallback(async () => {
    const userId = getOrCreateUserId()
    try {
      const res = await fetch(`/api/matches?userId=${encodeURIComponent(userId)}&connectionType=open`)
      if (!res.ok) return
      const data = await res.json()
      if (data.noPortrait) { setNoPortrait(true); return }
      const mapped: Match[] = (data.matches ?? []).map((m: Omit<Match, "resonanceSignals"> & { resonanceSignals: string[] }) => ({
        ...m,
        resonanceSignals: m.resonanceSignals.map((text: string, i: number) => ({ text, isPaid: i > 1 })),
      }))
      setMatches(mapped)
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  const handleConnect = useCallback(async (matchId: string) => {
    const userId = getOrCreateUserId()
    if (actingId) return
    setActingId(matchId)
    try {
      const res = await fetch("/api/matches/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId, userId }) })
      if (!res.ok) return
      const data = await res.json()
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: "connected" } : m))
      if (data.mutual) setMutuals((prev) => ({ ...prev, [matchId]: { matchId, conversationId: data.conversationId, firstPrompt: data.firstPrompt } }))
    } catch { } finally { setActingId(null) }
  }, [actingId])

  const handleNotAFit = useCallback(async (matchId: string) => {
    const userId = getOrCreateUserId()
    if (actingId) return
    setActingId(matchId)
    try {
      await fetch("/api/matches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId, action: "not_a_fit" }) })
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: "not_a_fit" } : m))
    } catch { } finally { setActingId(null) }
  }, [actingId])

  const visibleMatches = matches.filter((m) => m.status !== "not_a_fit")

  return (
    <div style={{ flex: 1, width: "100%", maxWidth: "640px", margin: "0 auto", padding: embedded ? "24px 20px 40px" : "40px 20px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "24px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text)", letterSpacing: "0.04em" }}>[connections]</span>
        {!loading && visibleMatches.length > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.03em" }}>{visibleMatches.length} found</span>
        )}
      </div>

      {loading && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", paddingTop: "10vh", textAlign: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
          [finding matches...]
        </div>
      )}

      {!loading && (noPortrait || visibleMatches.length === 0) && <EmptyState noPortrait={noPortrait} />}

      {!loading && visibleMatches.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visibleMatches.map((match) => (
            <MatchCard key={match.id} match={match} onConnect={handleConnect} onNotAFit={handleNotAFit} mutual={mutuals[match.id] ?? null} isActing={actingId === match.id} />
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}
