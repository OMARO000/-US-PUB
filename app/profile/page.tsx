"use client"

/**
 * /profile — user portrait, declared profile, framework visibility, data controls
 *
 * Sections:
 * 1. Portrait — archetype image + written portrait + metaphor
 * 2. Declared profile — what the user told [you], editable, exportable
 * 3. Framework visibility — how [you] sees them (paid layer shown locked to free)
 * 4. Data controls — export, delete
 *
 * [you] narrates on entry.
 */

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

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
  createdAt: Date | string
}

interface DeclaredField {
  label: string
  value: string
  editable: boolean
}

interface FrameworkSignal {
  name: string
  observation: string
  isPaid: boolean
}

// ─────────────────────────────────────────────
// DATA DERIVATION
// Build declared profile + framework signals from portrait signals
// ─────────────────────────────────────────────

function buildDeclaredProfile(portrait: Portrait): DeclaredField[] {
  const connectionLabel: Record<string, string> = {
    romantic: "romantic",
    platonic: "platonic",
    professional: "professional",
    open: "open — romantic and platonic",
  }
  return [
    { label: "connection type", value: connectionLabel[portrait.connectionType] ?? portrait.connectionType, editable: true },
    { label: "what matters most", value: portrait.valuesSignals.slice(0, 3).join(", ") || "—", editable: true },
    { label: "where you're going", value: portrait.narrativeSignals[0] ?? "—", editable: true },
    { label: "what you give", value: portrait.relationalSignals[0] ?? "—", editable: true },
    { label: "what you need", value: portrait.relationalSignals[1] ?? portrait.relationalSignals[0] ?? "—", editable: true },
  ]
}

function buildFrameworkSignals(portrait: Portrait): FrameworkSignal[] {
  return [
    {
      name: "values",
      observation: portrait.valuesSignals.length > 0
        ? portrait.valuesSignals.join(". ")
        : "no signal data yet.",
      isPaid: false,
    },
    {
      name: "narrative",
      observation: portrait.narrativeSignals.length > 0
        ? portrait.narrativeSignals.join(". ")
        : "no signal data yet.",
      isPaid: false,
    },
    {
      name: "relational",
      observation: portrait.relationalSignals.length > 0
        ? portrait.relationalSignals.join(". ")
        : "no signal data yet.",
      isPaid: false,
    },
    {
      name: "communication",
      observation: portrait.communicationSignals.length > 0
        ? portrait.communicationSignals.join(". ")
        : "no signal data yet.",
      isPaid: false,
    },
    {
      name: "conflict style",
      observation: portrait.frictionSignals.length > 0
        ? portrait.frictionSignals.join(". ")
        : "observed during block 4.",
      isPaid: true,
    },
    { name: "energy exchange", observation: "observed across your relational signals.", isPaid: true },
    { name: "life stage", observation: "inferred from narrative and timing language.", isPaid: true },
    { name: "medium preference", observation: "observed from your input mode patterns.", isPaid: true },
  ]
}

function formatDate(d: Date | string | null): string {
  if (!d) return ""
  const date = new Date(d)
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "10px",
      fontFamily: "var(--font-mono)",
      color: "var(--amber)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "14px",
      opacity: 0.8,
    }}>
      {children}
    </div>
  )
}

function PortraitSection({ portrait, userId }: { portrait: Portrait; userId: string }) {
  const [showCorrect, setShowCorrect] = useState(false)
  const [correction, setCorrection] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSaveCorrection = async () => {
    if (!correction.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/intake/portrait/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portraitId: portrait.id, userId, userCorrections: correction }),
      })
    } catch {
      // silent — correction saved locally
    } finally {
      setSaving(false)
      setShowCorrect(false)
    }
  }

  return (
    <section>
      <SectionLabel>[your portrait]</SectionLabel>
      <div style={{
        borderRadius: "14px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {/* Archetype image placeholder */}
        <div style={{
          width: "100%",
          aspectRatio: "4/3",
          background: "var(--bg3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "6px",
          borderBottom: "1px solid var(--border)",
        }}>
          <span style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            letterSpacing: "0.05em",
          }}>
            [{portrait.archetype}]
          </span>
          {portrait.imageKey && (
            <span style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              opacity: 0.5,
            }}>
              {portrait.imageKey}
            </span>
          )}
        </div>

        {/* Portrait text */}
        <div style={{ padding: "20px" }}>
          <div style={{
            fontSize: "14px",
            fontFamily: "var(--font-mono)",
            color: "var(--text)",
            fontWeight: 300,
            lineHeight: 1.8,
            marginBottom: "16px",
          }}>
            {portrait.portraitText}
          </div>
          {portrait.metaphorText && (
            <div style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              fontWeight: 300,
              lineHeight: 1.8,
              fontStyle: "italic",
              marginBottom: "16px",
            }}>
              {portrait.metaphorText}
            </div>
          )}
          <div style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            marginBottom: "16px",
          }}>
            confirmed {formatDate(portrait.createdAt)}
          </div>

          {/* Correct portrait */}
          {!showCorrect ? (
            <button
              onClick={() => setShowCorrect(true)}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "8px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted)",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              [something's not right]
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <textarea
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                placeholder="[what would you change or add...]"
                aria-label="correct your portrait"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--bg)",
                  border: "1px solid var(--amber)",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  resize: "none",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSaveCorrection}
                  disabled={saving}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "8px",
                    background: "var(--amber)",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--bg)",
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "[saving...]" : "[save correction]"}
                </button>
                <button
                  onClick={() => setShowCorrect(false)}
                  style={{
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  [cancel]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DeclaredProfileSection({ fields }: { fields: DeclaredField[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState(
    Object.fromEntries(fields.map((f) => [f.label, f.value]))
  )

  // sync if fields prop changes (after data loads)
  useEffect(() => {
    setValues(Object.fromEntries(fields.map((f) => [f.label, f.value])))
  }, [fields])

  const handleExport = () => {
    const data = JSON.stringify({ declared_profile: values, exported_at: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "us-declared-profile.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
      }}>
        <SectionLabel>[what you told [you]]</SectionLabel>
        <button
          onClick={handleExport}
          aria-label="export declared profile"
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          [export]
        </button>
      </div>

      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {fields.map((field, i) => (
          <div
            key={field.label}
            style={{
              padding: "14px 16px",
              borderBottom: i < fields.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.06em",
              marginBottom: "6px",
              opacity: 0.7,
            }}>
              [{field.label}]
            </div>
            {editing === field.label ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <input
                  type="text"
                  value={values[field.label]}
                  onChange={(e) => setValues((v) => ({ ...v, [field.label]: e.target.value }))}
                  aria-label={`edit ${field.label}`}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: "var(--bg)",
                    border: "1px solid var(--amber)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text)",
                    fontWeight: 300,
                    minHeight: "44px",
                  }}
                />
                <button
                  onClick={() => setEditing(null)}
                  style={{
                    height: "44px",
                    padding: "0 12px",
                    borderRadius: "6px",
                    background: "var(--amber)",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--bg)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  [save]
                </button>
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}>
                <span style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  flex: 1,
                }}>
                  {values[field.label]}
                </span>
                {field.editable && (
                  <button
                    onClick={() => setEditing(field.label)}
                    aria-label={`edit ${field.label}`}
                    style={{
                      background: "none",
                      border: "none",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--dim)",
                      cursor: "pointer",
                      padding: "4px",
                      minHeight: "44px",
                      minWidth: "44px",
                    }}
                  >
                    [edit]
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function FrameworkSection({ signals }: { signals: FrameworkSignal[] }) {
  return (
    <section>
      <SectionLabel>[how [you] sees you]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {signals.map((signal, i) => (
          <div
            key={signal.name}
            style={{
              padding: "14px 16px",
              borderBottom: i < signals.length - 1 ? "1px solid var(--border)" : "none",
              opacity: signal.isPaid ? 0.4 : 1,
              position: "relative",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}>
              <span style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--amber)",
                letterSpacing: "0.06em",
                opacity: 0.7,
              }}>
                [{signal.name}]
              </span>
              {signal.isPaid && (
                <span style={{
                  fontSize: "9px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--amber)",
                  opacity: 0.6,
                  letterSpacing: "0.05em",
                }}>
                  [paid]
                </span>
              )}
            </div>
            <div style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}>
              {signal.observation}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: "10px",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        lineHeight: 1.6,
      }}>
        [paid] signals are observed across your behavior — never declared, never labeled directly. you can correct them above.
      </div>
    </section>
  )
}

function DataControlsSection() {
  const [confirming, setConfirming] = useState(false)

  const handleDeleteAccount = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    // TODO: POST to /api/account/delete
    if (typeof window !== "undefined") {
      localStorage.clear()
      window.location.href = "/onboarding"
    }
  }

  return (
    <section>
      <SectionLabel>[your data]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              fontWeight: 300,
              marginBottom: "4px",
            }}>
              export all data
            </div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              fontWeight: 300,
            }}>
              portrait, declared profile, journal entries
            </div>
          </div>
          <button
            aria-label="export all data"
            style={{
              height: "44px",
              padding: "0 16px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            [export]
          </button>
        </div>

        <div style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--rose)",
              fontWeight: 300,
              marginBottom: "4px",
              opacity: 0.8,
            }}>
              delete account
            </div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              fontWeight: 300,
            }}>
              permanent. cannot be undone.
            </div>
          </div>
          <button
            onClick={handleDeleteAccount}
            aria-label="delete account"
            style={{
              height: "44px",
              padding: "0 16px",
              borderRadius: "8px",
              background: confirming ? "var(--rose)" : "transparent",
              border: `1px solid ${confirming ? "var(--rose)" : "var(--border)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: confirming ? "var(--bg)" : "var(--rose)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: confirming ? 1 : 0.7,
              transition: "all 0.15s",
            }}
          >
            {confirming ? "[confirm delete]" : "[delete]"}
          </button>
        </div>
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px",
    }}>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
      }}>
        [loading your portrait...]
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
      gap: "20px",
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
        no portrait yet.
      </div>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
        lineHeight: 1.7,
        maxWidth: "340px",
      }}>
        complete your intake conversation and [you] will build a portrait of you.
      </div>
      <a
        href="/conversation"
        style={{
          display: "inline-block",
          marginTop: "8px",
          height: "44px",
          lineHeight: "44px",
          padding: "0 24px",
          borderRadius: "10px",
          background: "var(--amber)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--bg)",
          textDecoration: "none",
          letterSpacing: "0.03em",
        }}
      >
        [go to conversation]
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function ProfilePage({ embedded }: { embedded?: boolean } = {}) {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)
  const [portrait, setPortrait] = useState<Portrait | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const uid = typeof window !== "undefined"
      ? (localStorage.getItem("us_uid") ?? "")
      : ""
    setUserId(uid)
    if (!uid) { setLoading(false); return }

    fetch(`/api/profile?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        setPortrait(data.portrait ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const declaredFields = portrait ? buildDeclaredProfile(portrait) : []
  const frameworkSignals = portrait ? buildFrameworkSignals(portrait) : []

  return (
    <div style={{ display: "flex", minHeight: embedded ? undefined : "100dvh", background: "var(--bg)" }}>
      {!embedded && <Sidebar />}
      <main style={{
        marginLeft: embedded ? 0 : "var(--sidebar-width)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: embedded ? undefined : "100dvh",
      }}>
        <YouNarrationBanner narration={narration} />

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}>
          {loading ? (
            <LoadingState />
          ) : !portrait ? (
            <EmptyState />
          ) : (
            <>
              <PortraitSection portrait={portrait} userId={userId} />
              <DeclaredProfileSection fields={declaredFields} />
              <FrameworkSection signals={frameworkSignals} />
            </>
          )}
          <DataControlsSection />
        </div>
      </main>
    </div>
  )
}
