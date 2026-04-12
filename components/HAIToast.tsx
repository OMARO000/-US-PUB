'use client'
import { useState, useEffect } from 'react'

export default function HAIToast() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const shown = sessionStorage.getItem('hai_toast_shown')
    if (shown) return
    const timer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem('hai_toast_shown', 'true')
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible || dismissed) return null

  return (
    <div style={{
      position: "fixed",
      bottom: "32px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      background: "rgba(13,17,23,0.95)",
      border: "1px solid rgba(196,151,74,0.25)",
      borderRadius: "8px",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      fontFamily: "var(--font-ibm-plex-mono), monospace",
      fontSize: "11px",
      letterSpacing: "0.06em",
      animation: "fadeInUp 0.4s ease",
    }}>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>
        [us] is built to the HAI Standard.
      </span>
      <a
        href="https://haiproject.xyz"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#C4974A", textDecoration: "none", whiteSpace: "nowrap" }}
      >
        [learn more →]
      </a>
      <button
        onClick={() => { setVisible(false); setDismissed(true) }}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.25)",
          cursor: "pointer",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: "11px",
          padding: "0",
          letterSpacing: "0.06em",
        }}
      >
        [×]
      </button>
    </div>
  )
}
