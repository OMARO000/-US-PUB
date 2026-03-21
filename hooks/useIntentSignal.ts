"use client"

/**
 * useIntentSignal — polls /api/matches every 60s
 * Returns true if any pending match has intentSignal = true
 * Clears when user visits connections
 */

import { useState, useEffect, useCallback, useRef } from "react"

const POLL_MS = 60_000

export function useIntentSignal(userId: string | null, connectionsActive: boolean): boolean {
  const [hasIntent, setHasIntent] = useState(false)
  const clearedRef = useRef(false)

  const noPortraitRef = useRef(false)

  const check = useCallback(async () => {
    if (!userId || noPortraitRef.current) return
    try {
      const res = await fetch(
        `/api/matches?userId=${encodeURIComponent(userId)}&connectionType=open`,
        { cache: "no-store" }
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.noPortrait) {
        noPortraitRef.current = true
        return
      }
      const intent = (data.matches ?? []).some(
        (m: { intentSignal: boolean; status: string }) =>
          m.intentSignal && m.status === "pending"
      )
      setHasIntent(intent)
    } catch {
      // silent
    }
  }, [userId])

  // clear when connections tab is active
  useEffect(() => {
    if (connectionsActive) {
      setHasIntent(false)
      clearedRef.current = true
    }
  }, [connectionsActive])

  // poll on mount and every 60s
  useEffect(() => {
    if (!userId) return
    check()
    const interval = setInterval(check, POLL_MS)
    return () => clearInterval(interval)
  }, [userId, check])

  return hasIntent
}
