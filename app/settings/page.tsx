"use client"

/**
 * /settings
 *
 * Sections:
 * 1. Appearance — theme switcher with live preview
 * 2. Voice — change [u]'s voice
 * 3. Account — anonymous account number, copy
 * 4. Notifications — match alerts, journal prompts
 *
 * All preferences stored in localStorage.
 * [u] narrates on entry.
 */

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"
import { useTheme } from "@/components/themes/ThemeProvider"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface Voice {
  voice_id: string
  name: string
  labels?: Record<string, string>
  preview_url?: string
}

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────

const THEMES = [
  { id: "light",    label: "[light]",    bg: "#F5F2EE", bg2: "#EDEAE5", amber: "#A67C3A", rose: "#A85860" },
  { id: "charcoal", label: "[charcoal]", bg: "#1C1C1E", bg2: "#242426", amber: "#C4974A", rose: "#C4848A" },
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

function SettingRow({
  label,
  description,
  children,
  noBorder = false,
}: {
  label: string
  description?: string
  children: React.ReactNode
  noBorder?: boolean
}) {
  return (
    <div style={{
      padding: "16px",
      borderBottom: noBorder ? "none" : "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
    }}>
      <div>
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          marginBottom: description ? "4px" : 0,
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            fontWeight: 300,
            lineHeight: 1.5,
          }}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-label={label}
      aria-pressed={value}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        background: value ? "var(--amber)" : "var(--bg3)",
        border: "1px solid var(--border2)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: "3px",
        left: value ? "22px" : "3px",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        background: "var(--text)",
        transition: "left 0.2s",
        opacity: 0.9,
      }} />
    </button>
  )
}

// ─────────────────────────────────────────────
// APPEARANCE SECTION
// ─────────────────────────────────────────────

function getThemeByTime(): "light" | "charcoal" {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 20 ? "light" : "charcoal"
}

function AppearanceSection({ currentTheme, onThemeChange }: {
  currentTheme: string
  onThemeChange: (id: string) => void
}) {
  const [autoTheme, setAutoTheme] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("us_auto_theme") === "true"
  })

  useEffect(() => {
    if (!autoTheme) return
    const theme = getThemeByTime()
    onThemeChange(theme)
  }, [autoTheme])

  return (
    <section>
      <SectionLabel>[appearance]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {THEMES.map((theme, i) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            aria-label={`select ${theme.label} theme`}
            aria-pressed={currentTheme === theme.id}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 16px",
              borderBottom: i < THEMES.length - 1 ? "1px solid var(--border)" : "none",
              background: currentTheme === theme.id ? "var(--bg3)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: theme.bg, border: "1px solid rgba(255,255,255,0.1)" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: theme.amber }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: theme.rose }} />
            </div>
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: currentTheme === theme.id ? "var(--amber)" : "var(--muted)",
              flex: 1,
            }}>
              {theme.label}
            </span>
            {currentTheme === theme.id && (
              <span style={{
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                color: "var(--amber)",
                opacity: 0.7,
              }}>
                [active]
              </span>
            )}
          </button>
        ))}
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <div>
            <div style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              fontWeight: 300,
              marginBottom: "4px",
            }}>
              auto theme
            </div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              fontWeight: 300,
              lineHeight: 1.5,
            }}>
              light 6am–8pm · charcoal after dark
            </div>
          </div>
          <Toggle
            value={autoTheme}
            onChange={(v) => {
              setAutoTheme(v)
              localStorage.setItem("us_auto_theme", String(v))
              if (v) onThemeChange(getThemeByTime())
            }}
            label="toggle auto theme"
          />
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// VOICE SECTION
// ─────────────────────────────────────────────

function VoiceSection({ currentVoiceId, onVoiceChange }: {
  currentVoiceId: string
  onVoiceChange: (id: string) => void
}) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentVoice = voices.find((v) => v.voice_id === currentVoiceId)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => setPlaying(null)
    return () => audioRef.current?.pause()
  }, [])

  useEffect(() => {
    if (!expanded || voices.length > 0) return
    setLoading(true)
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => { setVoices(data.voices ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [expanded, voices.length])

  const filtered = voices.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  )

  const playPreview = async (voice: Voice) => {
    if (!voice.preview_url || !audioRef.current) return
    if (playing === voice.voice_id) {
      audioRef.current.pause()
      setPlaying(null)
      return
    }
    audioRef.current.src = voice.preview_url
    await audioRef.current.play()
    setPlaying(voice.voice_id)
  }

  return (
    <section>
      <SectionLabel>[[u]'s voice]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {/* Current voice display */}
        <div style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: expanded ? "1px solid var(--border)" : "none",
        }}>
          <div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              marginBottom: "4px",
            }}>
              current voice
            </div>
            <div style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
              fontWeight: 300,
            }}>
              {currentVoice?.name ?? "[loading...]"}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
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
            {expanded ? "[close]" : "[change]"}
          </button>
        </div>

        {/* Voice picker */}
        {expanded && (
          <div style={{ padding: "12px 16px 16px" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="[search voices...]"
              aria-label="search voices"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text)",
                fontWeight: 300,
                marginBottom: "10px",
              }}
            />
            <div style={{
              maxHeight: "240px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}>
              {loading && (
                <div style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--dim)",
                  padding: "12px 0",
                  textAlign: "center",
                }}>
                  [loading voices...]
                </div>
              )}
              {filtered.map((voice) => (
                <div
                  key={voice.voice_id}
                  onClick={() => { onVoiceChange(voice.voice_id); setExpanded(false) }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: currentVoiceId === voice.voice_id ? "var(--bg3)" : "var(--bg)",
                    border: `1px solid ${currentVoiceId === voice.voice_id ? "var(--amber)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); playPreview(voice) }}
                    aria-label={`preview ${voice.name}`}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: playing === voice.voice_id ? "var(--amber)" : "var(--bg3)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "9px",
                      color: playing === voice.voice_id ? "var(--bg)" : "var(--muted)",
                      flexShrink: 0,
                      minHeight: "44px",
                      minWidth: "44px",
                    }}
                  >
                    {playing === voice.voice_id ? "■" : "▶"}
                  </button>
                  <span style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    color: currentVoiceId === voice.voice_id ? "var(--amber)" : "var(--text)",
                    fontWeight: 300,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {voice.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// ACCOUNT SECTION
// ─────────────────────────────────────────────

function AccountSection() {
  const [accountNumber, setAccountNumber] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem("us_account_number")
    if (saved) {
      setAccountNumber(saved)
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <SectionLabel>[account]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <SettingRow
          label="account number"
          description="your anonymous identifier. no email, no name."
          noBorder
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              letterSpacing: "0.12em",
            }}>
              {accountNumber || "[issued after intake]"}
            </span>
            <button
              onClick={handleCopy}
              aria-label="copy account number"
              style={{
                height: "44px",
                padding: "0 12px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: copied ? "var(--amber)" : "var(--muted)",
                cursor: "pointer",
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "[copied]" : "[copy]"}
            </button>
          </div>
        </SettingRow>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    newMatches: true,
    connections: true,
    journalPrompts: false,
    youInsights: true,
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem("us_notifs")
    if (saved) {
      try { setNotifs(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const update = (key: keyof typeof notifs, value: boolean) => {
    const next = { ...notifs, [key]: value }
    setNotifs(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("us_notifs", JSON.stringify(next))
    }
  }

  return (
    <section>
      <SectionLabel>[notifications]</SectionLabel>
      <div style={{
        borderRadius: "12px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <SettingRow label="new matches" description="when [u] finds someone who resonates">
          <Toggle value={notifs.newMatches} onChange={(v) => update("newMatches", v)} label="toggle new match notifications" />
        </SettingRow>
        <SettingRow label="connections" description="when someone connects with you">
          <Toggle value={notifs.connections} onChange={(v) => update("connections", v)} label="toggle connection notifications" />
        </SettingRow>
        <SettingRow label="[u] insights" description="when [u] notices a new pattern">
          <Toggle value={notifs.youInsights} onChange={(v) => update("youInsights", v)} label="toggle insight notifications" />
        </SettingRow>
        <SettingRow label="journal prompts" description="occasional prompts from [u]" noBorder>
          <Toggle value={notifs.journalPrompts} onChange={(v) => update("journalPrompts", v)} label="toggle journal prompt notifications" />
        </SettingRow>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function SettingsPage({ embedded }: { embedded?: boolean } = {}) {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)

  const { theme: currentTheme, setTheme } = useTheme()
  const [currentVoiceId, setCurrentVoiceId] = useState("UgBBYS2sOqTuMpoF3BR0")

  useEffect(() => {
    if (typeof window === "undefined") return
    setCurrentVoiceId(localStorage.getItem("us_voice_id") ?? "UgBBYS2sOqTuMpoF3BR0")
  }, [])

  const handleThemeChange = (id: string) => {
    setTheme(id as Parameters<typeof setTheme>[0])
  }

  const handleVoiceChange = (id: string) => {
    setCurrentVoiceId(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("us_voice_id", id)
    }
  }

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
          <AppearanceSection currentTheme={currentTheme} onThemeChange={handleThemeChange} />
          <VoiceSection currentVoiceId={currentVoiceId} onVoiceChange={handleVoiceChange} />
          <AccountSection />
          <NotificationsSection />
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => {
                localStorage.removeItem("us_onboarded")
                localStorage.removeItem("us_uid")
                localStorage.removeItem("us_account_number")
                window.location.href = "/"
              }}
              style={{
                height: "40px",
                width: "100%",
                borderRadius: "9px",
                background: "transparent",
                border: "1px dashed var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--dim)",
                cursor: "pointer",
                letterSpacing: "0.04em",
                opacity: 0.4,
              }}
            >
              [dev: reset onboarding]
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
