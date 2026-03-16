"use client"

/**
 * /journal — private reflection space
 *
 * Voice or text entries. [you] can reference entries in coaching with user consent.
 * Consent toggle: per-session, stored in localStorage.
 * [you] narrates on entry — quiet, brief.
 * Entries stored in SQLite via API (to be wired when DB is ready).
 */

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface JournalEntry {
  id: string
  content: string
  inputMode: "voice" | "text"
  youPrompt?: string        // the [you] prompt that sparked this entry, if any
  allowYouAccess: boolean   // whether [you] can reference this entry
  createdAt: Date
}

// ─────────────────────────────────────────────
// PLACEHOLDER ENTRIES
// Replace with real DB fetch when API is wired
// ─────────────────────────────────────────────

const PLACEHOLDER_ENTRIES: JournalEntry[] = [
  {
    id: "1",
    content: "i keep thinking about what [you] said — that i give before i ask. i do. i don't know if that's generosity or if i'm just afraid of asking.",
    inputMode: "text",
    youPrompt: "after your last conversation, [you] noticed you pulled back when things got quiet — anything worth noting?",
    allowYouAccess: true,
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "2",
    content: "met someone who reminded me of how i used to be. not sure if that's good or not.",
    inputMode: "voice",
    allowYouAccess: false,
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
]

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function ConsentToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-label={value ? "disable [you] access to journal" : "enable [you] access to journal"}
      aria-pressed={value}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 0",
      }}
    >
      <div style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        background: value ? "var(--amber)" : "var(--bg3)",
        position: "relative",
        transition: "background 0.2s",
        border: "1px solid var(--border2)",
        flexShrink: 0,
      }}>
        <div style={{
          position: "absolute",
          top: "2px",
          left: value ? "18px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "var(--text)",
          transition: "left 0.2s",
          opacity: 0.9,
        }} />
      </div>
      <span style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        fontWeight: 300,
      }}>
        {value ? "[you] can reference your journal in coaching" : "[you] cannot see your journal"}
      </span>
    </button>
  )
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const date = entry.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <div style={{
      padding: "16px",
      borderRadius: "10px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {entry.youPrompt && (
        <div style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          fontWeight: 300,
          lineHeight: 1.5,
          opacity: 0.7,
          borderLeft: "2px solid var(--amber)",
          paddingLeft: "10px",
        }}>
          {entry.youPrompt}
        </div>
      )}
      <div style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
        lineHeight: 1.7,
      }}>
        {entry.content}
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
        }}>
          {date} · {entry.inputMode === "voice" ? "[voice]" : "[text]"}
        </span>
        <span style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: entry.allowYouAccess ? "var(--amber)" : "var(--dim)",
          opacity: 0.7,
        }}>
          {entry.allowYouAccess ? "[you] can see this" : "[private]"}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function JournalPage() {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)

  const [entries] = useState<JournalEntry[]>(PLACEHOLDER_ENTRIES)
  const [youConsent, setYouConsent] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("us_journal_consent") === "true"
  })
  const [newEntry, setNewEntry] = useState("")
  const [isWriting, setIsWriting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // persist consent
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("us_journal_consent", String(youConsent))
    }
  }, [youConsent])

  const handleSubmit = () => {
    if (!newEntry.trim()) return
    // TODO: POST to /api/journal/entry when DB is wired
    setNewEntry("")
    setIsWriting(false)
  }

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
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}>

          {/* Consent toggle */}
          <section>
            <ConsentToggle value={youConsent} onChange={setYouConsent} />
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              lineHeight: 1.6,
              marginTop: "4px",
              paddingLeft: "46px",
            }}>
              when enabled, [you] may reference your journal entries in coaching conversations. [you] observes patterns — it never quotes your entries directly.
            </div>
          </section>

          {/* New entry */}
          <section>
            {!isWriting ? (
              <button
                onClick={() => { setIsWriting(true); setTimeout(() => textareaRef.current?.focus(), 50) }}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  textAlign: "left",
                  cursor: "text",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "var(--dim)",
                  fontWeight: 300,
                }}
              >
                [something worth noting...]
              </button>
            ) : (
              <div style={{
                borderRadius: "10px",
                background: "var(--bg2)",
                border: "1px solid var(--amber)",
                overflow: "hidden",
              }}>
                <textarea
                  ref={textareaRef}
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  placeholder="[write something...]"
                  aria-label="journal entry"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--text)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    resize: "none",
                  }}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  padding: "8px 12px",
                  borderTop: "1px solid var(--border)",
                }}>
                  <button
                    onClick={() => { setIsWriting(false); setNewEntry("") }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--muted)",
                      cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    [cancel]
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!newEntry.trim()}
                    aria-label="save journal entry"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: newEntry.trim() ? "var(--amber)" : "var(--bg3)",
                      border: "none",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: newEntry.trim() ? "var(--bg)" : "var(--dim)",
                      cursor: newEntry.trim() ? "pointer" : "default",
                      transition: "background 0.15s",
                      minHeight: "44px",
                    }}
                  >
                    [save]
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Entries */}
          <section>
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
              opacity: 0.8,
            }}>
              [recent entries]
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
