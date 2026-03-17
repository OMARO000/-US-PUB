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

import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// PLACEHOLDER DATA
// Replace with real DB fetch when profile API is wired
// ─────────────────────────────────────────────

const PORTRAIT = {
  archetype: "horizon",
  imageKey: "horizon_02",
  portraitText: "you tend to arrive before you're ready — and go anyway. you know what you stand for, even when you can't always name it. the people you're drawn to are in motion, like you. you give before you ask, and you notice when that isn't returned.",
  metaphorText: "we chose an image for you: a coastline at the exact moment before dawn, when the light hasn't arrived yet but you can already feel it coming.",
  confirmedAt: "March 14, 2026",
}

const DECLARED_PROFILE = [
  { label: "connection type", value: "open — romantic and platonic", editable: true },
  { label: "what matters most", value: "honesty, direction, depth", editable: true },
  { label: "where you're going", value: "building something, figuring out what", editable: true },
  { label: "what you give", value: "attention, care, directness", editable: true },
  { label: "what you need", value: "someone who can hold their own", editable: true },
]

const FRAMEWORK_SIGNALS = [
  { name: "values", observation: "you know what you stand for. it came through in nearly every exchange.", isPaid: false },
  { name: "narrative", observation: "high aspiration language — you're building toward something, even if unnamed.", isPaid: false },
  { name: "relational", observation: "depth-seeker. you give before asking. the gap between what you offer and what you receive is visible.", isPaid: false },
  { name: "communication", observation: "direct. you say the hard thing without waiting for permission.", isPaid: false },
  { name: "conflict style", observation: "you engage rather than avoid. repair is slower than entry.", isPaid: true },
  { name: "energy exchange", observation: "high-give. worth sitting with.", isPaid: true },
  { name: "life stage", observation: "in motion. not settling, not arriving — building.", isPaid: true },
  { name: "medium preference", observation: "voice-first. you said more when you could hear yourself saying it.", isPaid: true },
]

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

function PortraitSection() {
  const [showCorrect, setShowCorrect] = useState(false)
  const [correction, setCorrection] = useState("")

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
            [{PORTRAIT.archetype}]
          </span>
          <span style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            opacity: 0.5,
          }}>
            {PORTRAIT.imageKey}
          </span>
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
            {PORTRAIT.portraitText}
          </div>
          <div style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--amber)",
            fontWeight: 300,
            lineHeight: 1.8,
            fontStyle: "italic",
            marginBottom: "16px",
          }}>
            {PORTRAIT.metaphorText}
          </div>
          <div style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            marginBottom: "16px",
          }}>
            confirmed {PORTRAIT.confirmedAt}
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
                  onClick={() => {
                    // TODO: POST correction to /api/intake/portrait/confirm
                    setShowCorrect(false)
                  }}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "8px",
                    background: "var(--amber)",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--bg)",
                    cursor: "pointer",
                  }}
                >
                  [save correction]
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

function DeclaredProfileSection() {
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState(
    Object.fromEntries(DECLARED_PROFILE.map((f) => [f.label, f.value]))
  )

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
        {DECLARED_PROFILE.map((field, i) => (
          <div
            key={field.label}
            style={{
              padding: "14px 16px",
              borderBottom: i < DECLARED_PROFILE.length - 1 ? "1px solid var(--border)" : "none",
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

function FrameworkSection() {
  return (
    <section>
      <SectionLabel>[how [you] sees you]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {FRAMEWORK_SIGNALS.map((signal, i) => (
          <div
            key={signal.name}
            style={{
              padding: "14px 16px",
              borderBottom: i < FRAMEWORK_SIGNALS.length - 1 ? "1px solid var(--border)" : "none",
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

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

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
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}>
          <PortraitSection />
          <DeclaredProfileSection />
          <FrameworkSection />
          <DataControlsSection />
        </div>
      </main>
    </div>
  )
}
