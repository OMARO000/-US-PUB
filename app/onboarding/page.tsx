"use client"

/**
 * /onboarding — 3-screen onboarding flow
 *
 * Screen 1: Welcome — what [us] is
 * Screen 2: Theme picker — 5 themes, live preview
 * Screen 3: Voice picker — ElevenLabs library, preview, select
 *
 * No account creation. Anonymous ID already exists in localStorage.
 * On complete → mark onboarding done → redirect to /conversation
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Screen = "welcome" | "cookies" | "theme" | "voice"

interface Theme {
  id: string
  label: string
  bg: string
  bg2: string
  text: string
  amber: string
  rose: string
}

interface Voice {
  voice_id: string
  name: string
  labels?: Record<string, string>
  preview_url?: string
}

// ─────────────────────────────────────────────
// THEMES
// Must match ThemeProvider theme IDs
// ─────────────────────────────────────────────

const THEMES: Theme[] = [
  {
    id: "light",
    label: "[light]",
    bg: "#F5F2EE",
    bg2: "#EDEAE5",
    text: "rgba(28,24,20,0.88)",
    amber: "#A67C3A",
    rose: "#A85860",
  },
  {
    id: "charcoal",
    label: "[charcoal]",
    bg: "#1C1C1E",
    bg2: "#242426",
    text: "rgba(255,255,255,0.88)",
    amber: "#C4974A",
    rose: "#C4848A",
  },
]

// ─────────────────────────────────────────────
// SCREEN 1 — WELCOME
// ─────────────────────────────────────────────

function WelcomeScreen({ onNext, onLogin }: { onNext: () => void; onLogin: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "56px",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.8s ease",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "560px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "72px",
          fontFamily: "var(--font-sans)",
          color: "var(--amber)",
          fontWeight: 300,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}>
          [us]
        </div>
        <div style={{
          fontSize: "22px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          lineHeight: 1.9,
        }}>
          connection is hard.
        </div>
        <div style={{
          fontSize: "18px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
          lineHeight: 1.9,
        }}>
          not because the right people don't exist —<br />
          but because most of us don't know ourselves<br />
          well enough to recognize them.
        </div>
        <div style={{
          fontSize: "18px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          lineHeight: 1.9,
          marginTop: "8px",
        }}>
          [us] is built to change that.
        </div>
        <div style={{
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
          lineHeight: 1.7,
          opacity: 0.6,
          marginTop: "8px",
        }}>
          no profile to fill out.<br />
          no performance required.<br />
          just a conversation.
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        maxWidth: "280px",
      }}>
        <button
          onClick={onNext}
          aria-label="begin"
          style={{
            width: "100%",
            height: "64px",
            borderRadius: "16px",
            background: "var(--amber)",
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            color: "var(--bg)",
            cursor: "pointer",
            letterSpacing: "0.05em",
            fontWeight: 400,
          }}
        >
          [begin]
        </button>
        <button
          onClick={onLogin}
          aria-label="log in"
          style={{
            width: "100%",
            height: "64px",
            borderRadius: "16px",
            background: "var(--amber)",
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            color: "var(--bg)",
            cursor: "pointer",
            letterSpacing: "0.05em",
            fontWeight: 400,
          }}
        >
          [log in]
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SCREEN 2 — COOKIES
// ─────────────────────────────────────────────

function CookiesScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "48px",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "520px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          letterSpacing: "0.08em",
          opacity: 0.8,
        }}>
          [before we begin]
        </div>
        <div style={{
          fontSize: "18px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          lineHeight: 1.85,
        }}>
          [us] uses essential cookies to function. nothing more.
        </div>
        <div style={{
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
          lineHeight: 1.8,
        }}>
          we don't track you across the web.<br />
          we don't serve ads.<br />
          we don't sell your data to anyone, ever.<br /><br />
          cookies here are used only to keep your session alive
          and remember your preferences — theme, voice, and whether
          you've been here before.<br /><br />
          that's it. sovereign by design.
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          maxWidth: "360px",
          marginTop: "8px",
        }}>
          <button
            onClick={() => {
              localStorage.setItem("us_cookies_accepted", "true")
              onAccept()
            }}
            style={{
              height: "64px",
              borderRadius: "16px",
              background: "var(--amber)",
              border: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "16px",
              color: "var(--bg)",
              cursor: "pointer",
              letterSpacing: "0.05em",
              fontWeight: 400,
            }}
          >
            [i understand]
          </button>
          <a
            href="/privacy"
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              opacity: 0.6,
              textAlign: "center",
            }}
          >
            [read our full privacy policy →]
          </a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SCREEN 3 — THEME PICKER
// ─────────────────────────────────────────────

function ThemeScreen({
  selectedTheme,
  onSelect,
  onNext,
}: {
  selectedTheme: string
  onSelect: (id: string) => void
  onNext: () => void
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "52px",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "18px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          letterSpacing: "0.08em",
          opacity: 0.8,
        }}>
          [choose your environment]
        </div>
        <div style={{
          fontSize: "15px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
        }}>
          you can change this anytime in [settings]
        </div>
      </div>

      {/* Theme swatches */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: "480px",
      }}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            aria-label={`select ${theme.label} theme`}
            aria-pressed={selectedTheme === theme.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "18px 20px",
              borderRadius: "16px",
              background: theme.bg2,
              border: `1.5px solid ${selectedTheme === theme.id ? theme.amber : "rgba(255,255,255,0.08)"}`,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            {/* Color preview */}
            <div style={{
              display: "flex",
              gap: "4px",
              flexShrink: 0,
            }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.bg }} />
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.amber }} />
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.rose }} />
            </div>

            <span style={{
              fontSize: "15px",
              fontFamily: "var(--font-mono)",
              color: selectedTheme === theme.id ? theme.amber : theme.text,
              letterSpacing: "0.03em",
            }}>
              {theme.label}
            </span>

            {selectedTheme === theme.id && (
              <span style={{
                marginLeft: "auto",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: theme.amber,
                opacity: 0.8,
              }}>
                [selected]
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        aria-label="continue to voice selection"
        style={{
          height: "64px",
          padding: "0 52px",
          borderRadius: "16px",
          background: "var(--amber)",
          border: "none",
          fontFamily: "var(--font-mono)",
          fontSize: "16px",
          color: "var(--bg)",
          cursor: "pointer",
          letterSpacing: "0.05em",
        }}
      >
        [continue]
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// SCREEN 4 — VOICE PICKER
// ─────────────────────────────────────────────

function VoiceScreen({
  selectedVoice,
  onSelect,
  onComplete,
}: {
  selectedVoice: string
  onSelect: (id: string) => void
  onComplete: () => void
}) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => setPlaying(null)
    return () => audioRef.current?.pause()
  }, [])

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => {
        setVoices(data.voices ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100dvh",
      padding: "40px 32px 32px",
      gap: "32px",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "18px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          letterSpacing: "0.08em",
          opacity: 0.8,
        }}>
          [choose [u]'s voice]
        </div>
        <div style={{
          fontSize: "15px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          fontWeight: 300,
        }}>
          this is how [u] will speak to you
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="[search voices...]"
        aria-label="search voices"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "13px 18px",
          borderRadius: "13px",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          outline: "none",
          fontFamily: "var(--font-mono)",
          fontSize: "15px",
          color: "var(--text)",
          fontWeight: 300,
        }}
      />

      {/* Voice list */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxHeight: "calc(100dvh - 320px)",
      }}>
        {loading && (
          <div style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            textAlign: "center",
            padding: "20px",
          }}>
            [loading voices...]
          </div>
        )}
        {!loading && filtered.map((voice) => (
          <div
            key={voice.voice_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 18px",
              borderRadius: "13px",
              background: "var(--bg2)",
              border: `1px solid ${selectedVoice === voice.voice_id ? "var(--amber)" : "var(--border)"}`,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onClick={() => onSelect(voice.voice_id)}
          >
            {/* Play preview */}
            <button
              onClick={(e) => { e.stopPropagation(); playPreview(voice) }}
              aria-label={`preview ${voice.name}`}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: playing === voice.voice_id ? "var(--amber)" : "var(--bg3)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: playing === voice.voice_id ? "var(--bg)" : "var(--muted)",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {playing === voice.voice_id ? "■" : "▶"}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "15px",
                fontFamily: "var(--font-mono)",
                color: selectedVoice === voice.voice_id ? "var(--amber)" : "var(--text)",
                fontWeight: selectedVoice === voice.voice_id ? 400 : 300,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {voice.name}
              </div>
              {voice.labels?.accent && (
                <div style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--dim)",
                  marginTop: "2px",
                }}>
                  {voice.labels.accent}
                </div>
              )}
            </div>

            {selectedVoice === voice.voice_id && (
              <span style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--amber)",
                opacity: 0.8,
                flexShrink: 0,
              }}>
                [selected]
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        aria-label="complete onboarding"
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "64px",
          borderRadius: "16px",
          background: "var(--amber)",
          border: "none",
          fontFamily: "var(--font-mono)",
          fontSize: "16px",
          color: "var(--bg)",
          cursor: "pointer",
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}
      >
        [let's begin]
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("welcome")
  const [selectedTheme, setSelectedTheme] = useState("charcoal")
  const [selectedVoice, setSelectedVoice] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID ?? "UgBBYS2sOqTuMpoF3BR0"
  )

  // check if already onboarded
  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("us_onboarded") === "true") {
      router.replace("/conversation")
    }
    // load saved theme preference
    const savedTheme = localStorage.getItem("us-theme")
    if (savedTheme) setSelectedTheme(savedTheme)
  }, [router])

  const handleThemeSelect = (id: string) => {
    setSelectedTheme(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("us-theme", id)
      document.documentElement.setAttribute("data-theme", id)
    }
  }

  const handleComplete = async () => {
    if (typeof window === "undefined") return
    localStorage.setItem("us_onboarded", "true")
    localStorage.setItem("us-theme", selectedTheme)
    localStorage.setItem("us_voice_id", selectedVoice)

    const userId = localStorage.getItem("us_uid")
    if (userId) {
      try {
        await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, themeId: selectedTheme, voiceId: selectedVoice }),
        })
      } catch {
        // non-fatal — proceed to conversation
      }
    }

    router.push("/conversation")
  }

  const handleLogin = () => {
    // mark as onboarded and go straight to conversation
    // full auth flow to be wired here post-MVP
    if (typeof window !== "undefined") {
      localStorage.setItem("us_onboarded", "true")
    }
    router.push("/conversation")
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      {screen === "welcome" && (
        <WelcomeScreen onNext={() => setScreen("cookies")} onLogin={handleLogin} />
      )}
      {screen === "cookies" && (
        <CookiesScreen onAccept={() => setScreen("theme")} />
      )}
      {screen === "theme" && (
        <ThemeScreen
          selectedTheme={selectedTheme}
          onSelect={handleThemeSelect}
          onNext={() => setScreen("voice")}
        />
      )}
      {screen === "voice" && (
        <VoiceScreen
          selectedVoice={selectedVoice}
          onSelect={setSelectedVoice}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
