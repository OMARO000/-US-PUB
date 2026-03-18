"use client"
import { useState, useEffect } from "react"

export default function DMAnalysisBanner() {
  const [off, setOff] = useState(false)

  useEffect(() => {
    setOff(localStorage.getItem("us_dm_analysis_off") === "true")
  }, [])

  function turnOff() {
    localStorage.setItem("us_dm_analysis_off", "true")
    setOff(true)
  }

  if (off) {
    return (
      <div style={{
        padding: "0 16px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)",
      }}>
        <span style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
        }}>
          [analysis off]
        </span>
      </div>
    )
  }

  return (
    <div style={{
      padding: "14px 20px",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg2)",
    }}>
      <span style={{
        flex: 1,
        fontSize: "14px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        opacity: 0.85,
        lineHeight: 1.5,
      }}>
        [us] observes patterns in this conversation to improve your connection insights — not the content, just how you connect.
      </span>
      <button
        onClick={turnOff}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          padding: "0",
          flexShrink: 0,
          minHeight: "44px",
        }}
      >
        [turn off]
      </button>
    </div>
  )
}
