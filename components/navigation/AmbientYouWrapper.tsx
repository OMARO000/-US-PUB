"use client"

import { usePathname } from "next/navigation"
import AmbientYou from "./AmbientYou"

const EXCLUDED = ["/conversation", "/onboarding"]

export default function AmbientYouWrapper() {
  const pathname = usePathname()
  if (EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null
  return <AmbientYou />
}
