"use client"

/**
 * /profile — portrait, declared profile, framework signals, data controls
 */

import { useState, useEffect } from "react"

interface Portrait {
  id: string
  portraitText: string
  metaphorText: string | null
  archetype: string
  imageKey: string | null
  connectionType: string
  valuesSignals: string[]
  narrativeSignals: string[]
  relationalSignals: string[]
  communicationSignals: string[]
  frictionSignals: string[]
  userCorrections: string | null
  createdAt: string
}

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anon"
  const key = "us_uid"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = `anon_${crypto.randomUUID()}`
  localStorage.setItem(key, id)
  return id
}

const ARCHETYPE_COLORS: Record<string, string> = {
  rooted:    "rgba(80,160,100,0.15)",
  horizon:   "rgba(196,151,74,0.15)",
  intimate:  "rgba(168,88,96,0.15)",
  current:   "rgba(200,120,60,0.15)",
  liminal:   "rgba(100,140,200,0.15)",
  celestial: "rgba(130,100,200,0.15)",
  composite: "rgba(196,151,74,0.10)",
}

// ─────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "13px",
      background: "var(--bg2)",
      padding: "18px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      color: "var(--muted)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      opacity: 0.7,
    }}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────
// PORTRAIT SECTION
// ─────────────────────────────────────────────

function PortraitSection({ portrait }: { portrait: Portrait }) {
  const archetypeBg = ARCHETYPE_COLORS[portrait.archetype] ?? ARCHETYPE_COLORS.composite

  return (
    <Section>
      <SectionLabel>your portrait</SectionLabel>

      {/* archetype badge + image placeholder */}
      <div style={{
        width: "100%",
        aspectRatio: "16/7",
        borderRadius: "10px",
        background: archetypeBg,
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "6px",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.05em" }}>
          [{portrait.archetype}]
        </span>
        {portrait.imageKey && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.4 }}>
            {portrait.imageKey}
          </span>
        )}
      </div>

      {/* portrait text */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        fontWeight: 300,
        color: "var(--text)",
        lineHeight: 1.8,
        margin: 0,
      }}>
        {portrait.portraitText}
      </p>

      {/* metaphor */}
      {portrait.metaphorText && (
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          fontWeight: 300,
          color: "var(--amber)",
          fontStyle: "italic",
          lineHeight: 1.7,
          margin: 0,
        }}>
          {portrait.metaphorText}
        </p>
      )}

      {/* user corrections */}
      {portrait.userCorrections && (
        <div style={{
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}>
          <span style={{ opacity: 0.5 }}>[your addition] </span>
          {portrait.userCorrections}
        </div>
      )}
    </Section>
  )
}

// ─────────────────────────────────────────────
// DECLARED PROFILE SECTION
// ─────────────────────────────────────────────

interface DeclaredField { label: string; value: string; key: string }

function buildDeclaredProfile(portrait: Portrait): DeclaredField[] {
  return [
    {
      key: "values",
      label: "what matters to you",
      value: portrait.valuesSignals.slice(0, 3).join(", ") || "—",
    },
    {
      key: "direction",
      label: "where you're headed",
      value: portrait.narrativeSignals.slice(0, 2).join(", ") || "—",
    },
    {
      key: "connection",
      label: "how you connect",
      value: portrait.relationalSignals.slice(0, 2).join(", ") || "—",
    },
    {
      key: "communication",
      label: "how you communicate",
      value: portrait.communicationSignals.slice(0, 2).join(", ") || "—",
    },
    {
      key: "looking_for",
      label: "looking for",
      value: portrait.connectionType || "open",
    },
  ]
}

function DeclaredProfileSection({ portrait }: { portrait: Portrait }) {
  const fields = buildDeclaredProfile(portrait)
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries(fields.map((f) => [f.key, f.value]))
    if (typeof window === "undefined") return base
    return Object.fromEntries(
      fields.map((f) => {
        const saved = localStorage.getItem(`us_declared_${f.key}`)
        return [f.key, saved ?? f.value]
      })
    )
  })

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <SectionLabel>declared profile</SectionLabel>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.5 }}>
          yours — not shared
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {fields.map((field) => (
          <div key={field.key}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.6, marginBottom: "4px", letterSpacing: "0.04em" }}>
              {field.label}
            </div>
            {editing === field.key ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  autoFocus
                  value={values[field.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditing(null) }}
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--amber)",
                    borderRadius: "7px",
                    padding: "6px 10px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    localStorage.setItem(`us_declared_${field.key}`, values[field.key])
                    setEditing(null)
                  }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--amber)", background: "transparent", border: "none", cursor: "pointer", padding: "0 6px" }}
                >
                  [save]
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(field.key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: values[field.key] === "—" ? "var(--muted)" : "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.5,
                  opacity: values[field.key] === "—" ? 0.4 : 1,
                }}
              >
                {values[field.key]}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.4, lineHeight: 1.5 }}>
        tap any field to edit. corrections stay on your device.
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────
// FRAMEWORK SIGNALS SECTION
// ─────────────────────────────────────────────

interface FrameworkRow { label: string; value: string; isPaid: boolean }

function buildFrameworkSignals(portrait: Portrait): FrameworkRow[] {
  return [
    { label: "archetype", value: portrait.archetype, isPaid: false },
    { label: "connection type", value: portrait.connectionType, isPaid: false },
    { label: "relational style", value: portrait.relationalSignals[0] ?? "—", isPaid: false },
    { label: "communication", value: portrait.communicationSignals[0] ?? "—", isPaid: false },
    { label: "attachment pattern", value: "—", isPaid: true },
    { label: "conflict style", value: "—", isPaid: true },
    { label: "life stage signal", value: "—", isPaid: true },
    { label: "energy exchange", value: "—", isPaid: true },
  ]
}

function FrameworkSection({ portrait }: { portrait: Portrait }) {
  const rows = buildFrameworkSignals(portrait)

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <SectionLabel>how [them] sees you</SectionLabel>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.5 }}>
          frameworks are published
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "9px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            opacity: row.isPaid ? 0.4 : 1,
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.03em" }}>
              {row.label}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: row.isPaid ? "var(--muted)" : "var(--text)",
              filter: row.isPaid ? "blur(4px)" : "none",
              userSelect: row.isPaid ? "none" : "auto",
              letterSpacing: "0.03em",
            }}>
              {row.isPaid ? "unlocks with [go deeper]" : row.value}
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────
// DATA CONTROLS SECTION
// ─────────────────────────────────────────────

function DataControlsSection({ userId }: { userId: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
      const profileData = res.ok ? await res.json() : null
      const declared: Record<string, string> = {}
      const fields = ["values", "direction", "connection", "communication", "looking_for"]
      fields.forEach((key) => {
        const saved = localStorage.getItem(`us_declared_${key}`)
        if (saved) declared[key] = saved
      })
      const data = {
        userId,
        exportedAt: new Date().toISOString(),
        portrait: profileData?.portrait ?? null,
        declaredProfile: declared,
        note: "your data from [us] by OMARO PBC",
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "us-profile.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent — download best effort
    }
  }

  const handleDelete = async () => {
    try {
      await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      localStorage.clear()
      setDeleted(true)
      setTimeout(() => { window.location.href = "/" }, 2000)
    } catch {
      setConfirmDelete(false)
    }
  }

  if (deleted) {
    return (
      <Section>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
          [account deleted. redirecting...]
        </span>
      </Section>
    )
  }

  return (
    <Section>
      <SectionLabel>your data</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          onClick={handleExport}
          style={{
            height: "40px",
            borderRadius: "9px",
            background: "transparent",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--muted)",
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          [export my data]
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              height: "40px",
              borderRadius: "9px",
              background: "transparent",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
              cursor: "pointer",
              letterSpacing: "0.04em",
              opacity: 0.5,
            }}
          >
            [delete account]
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", lineHeight: 1.6 }}>
              this deletes everything. there is no undo.
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDelete}
                style={{ flex: 1, height: "40px", borderRadius: "9px", background: "transparent", border: "1px solid rgba(196,84,84,0.6)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(196,84,84,0.8)", cursor: "pointer", letterSpacing: "0.04em" }}
              >
                [yes, delete]
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ height: "40px", padding: "0 14px", borderRadius: "9px", background: "transparent", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", cursor: "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap" }}
              >
                [cancel]
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", opacity: 0.4, lineHeight: 1.6 }}>
        [us] by OMARO PBC · sovereign by design · no ads, no brokers
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────
// LOADING / EMPTY STATES
// ─────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "20vh" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", animation: "pulse 1.5s ease-in-out infinite" }}>
        [loading...]
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "20vh", gap: "12px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.7, maxWidth: "260px" }}>
        [your portrait isn't ready yet.]
      </span>
      <a href="/conversation" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--amber)", textDecoration: "none", letterSpacing: "0.04em" }}>
        [talk to [them] →]
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function ProfilePage({ embedded }: { embedded?: boolean } = {}) {
  const [portrait, setPortrait] = useState<Portrait | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const uid = getOrCreateUserId()
    setUserId(uid)

    fetch(`/api/profile?userId=${encodeURIComponent(uid)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.portrait) setPortrait(data.portrait)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      flex: 1,
      width: "100%",
      maxWidth: "600px",
      margin: "0 auto",
      padding: embedded ? "24px 20px 60px" : "40px 20px 60px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      overflowY: "auto",
    }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text)", letterSpacing: "0.04em" }}>
          [profile]
        </span>
      </div>

      {loading && <LoadingState />}
      {!loading && !portrait && <EmptyState />}
      {!loading && portrait && (
        <>
          <PortraitSection portrait={portrait} />
          <DeclaredProfileSection portrait={portrait} />
          <FrameworkSection portrait={portrait} />
          {userId && <DataControlsSection userId={userId} />}
        </>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
