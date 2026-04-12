"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  const handleLogin = () => {
    const trimmed = value.trim()
    if (!/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(trimmed)) {
      setError(true)
      return
    }
    setError(false)
    document.cookie = `us_account=${trimmed}; max-age=31536000; path=/`
    if (typeof window !== "undefined") {
      localStorage.setItem("us_onboarded", "true")
      localStorage.setItem("us_account_number", trimmed)
    }
    router.push("/conversation")
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      background: "var(--bg)",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
        width: "100%",
        maxWidth: "360px",
      }}>
        <div style={{
          fontSize: "48px",
          fontFamily: "var(--font-sans)",
          color: "var(--amber)",
          fontWeight: 300,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}>
          [us]
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
            placeholder="[your account number]"
            aria-label="account number"
            autoCapitalize="characters"
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: "14px",
              background: "var(--bg2)",
              border: `1px solid ${error ? "rgba(200,80,80,0.5)" : "var(--border)"}`,
              outline: "none",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "15px",
              color: "var(--text)",
              fontWeight: 300,
              caretColor: "var(--amber)",
              letterSpacing: "0.06em",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{
              fontSize: "12px",
              fontFamily: "IBM Plex Mono, monospace",
              color: "rgba(200,80,80,0.8)",
              letterSpacing: "0.04em",
              paddingLeft: "4px",
            }}>
              [account number not recognized]
            </div>
          )}
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "14px",
              background: "var(--amber)",
              border: "none",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "15px",
              color: "var(--bg)",
              cursor: "pointer",
              letterSpacing: "0.05em",
              fontWeight: 400,
            }}
          >
            [log in]
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <a
            href="/conversation"
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "13px",
              color: "var(--muted)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              opacity: 0.7,
            }}
          >
            [try it out instead →]
          </a>
          <div style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: "11px",
            color: "var(--dim)",
            opacity: 0.5,
            letterSpacing: "0.04em",
          }}>
            don't have an account?{" "}
            <a
              href="/onboarding"
              style={{ color: "var(--amber)", textDecoration: "none", opacity: 0.8 }}
            >
              [create one →]
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
