"use client"

/**
 * useIntentSignal — polls /api/matches and /api/notifications every 60s
 * Returns true if any pending match has intentSignal = true OR there are unread notifications
 * Clears when user visits connections
 */

import { useState, useEffect, useCallback, useRef } from "react"

const POLL_MS = 60_000

export function useIntentSignal(userId: string | null, connectionsActive: boolean): boolean {
  const [hasIntent, setHasIntent] = useState(false)
  const clearedRef = useRef(false)

  const noPortraitRef = useRef(false)

  const check = useCallback(async () => {
    if (!userId) return
    try {
      const [matchesRes, notifsRes] = await Promise.all([
        noPortraitRef.current
          ? Promise.resolve(null)
          : fetch(`/api/matches?userId=${encodeURIComponent(userId)}&connectionType=open`, { cache: "no-store" }),
        fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
      ])

      let intent = false

      if (matchesRes?.ok) {
        const data = await matchesRes.json()
        if (data.noPortrait) {
          noPortraitRef.current = true
        } else {
          intent = (data.matches ?? []).some(
            (m: { intentSignal: boolean; status: string }) =>
              m.intentSignal && m.status === "pending"
          )
        }
      }

      if (!intent && notifsRes?.ok) {
        const data = await notifsRes.json()
        const unread = (data.notifications ?? []).some((n: { read: boolean }) => !n.read)
        if (unread) intent = true
      }

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
