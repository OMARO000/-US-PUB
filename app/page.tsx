"use client"

/**
 * / — root page
 *
 * Checks if user has completed onboarding.
 * If not → /onboarding
 * If yes → /conversation
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const onboarded = localStorage.getItem("us_onboarded") === "true"
    if (onboarded) {
      router.replace("/conversation")
    } else {
      router.replace("/onboarding")
    }
  }, [router])

  return null
}
