"use client"
import { useState, useEffect } from "react"

export default function DMAnalysisBanner() {
  const [off, setOff] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOff(localStorage.getItem("us_dm_analysis_off") === "true")
  }, [])

  function turnOff() {
    localStorage.setItem("us_dm_analysis_off", "true")
    setOff(true)
  }

  function turnOn() {
    localStorage.setItem("us_dm_analysis_off", "false")
    setOff(false)
  }

  if (!mounted) return null

  if (off) {
    return (
      <div style={{
        padding: "0 20px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          letterSpacing: "0.06em",
          opacity: 0.6,
        }}>
          [pattern analysis off]
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); turnOn() }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            letterSpacing: "0.06em",
            padding: "6px 10px",
            minHeight: "44px",
            flexShrink: 0,
          }}
        >
          [turn on]
        </button>
      </div>
    )
  }

  return (
    <div style={{
      padding: "0 20px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg2)",
      flexShrink: 0,
    }}>
      <span style={{
        flex: 1,
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        opacity: 0.85,
        lineHeight: 1.5,
        letterSpacing: "0.02em",
      }}>
        WITNESS MODE: [us] observes patterns in this conversation to improve your connection insights — not the content, just how you connect.
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); turnOff() }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          letterSpacing: "0.06em",
          padding: "6px 10px",
          minHeight: "44px",
          flexShrink: 0,
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        [turn off]
      </button>
    </div>
  )
}
