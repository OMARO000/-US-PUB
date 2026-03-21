/**
 * POST /api/user — get or create user record
 * PATCH /api/user — update user preferences
 * DELETE /api/user — delete user and all data
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/users/getOrCreateUser"

// ─────────────────────────────────────────────
// POST — get or create user
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { userId: string; themeId?: string; voiceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, themeId, voiceId } = body
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    const user = await getOrCreateUser(userId, { themeId, voiceId })
    return NextResponse.json({ user })
  } catch (err) {
    console.error("[us] user POST error:", err)
    return NextResponse.json({ error: "failed to get or create user" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// PATCH — update user preferences
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  let body: {
    userId: string
    themeId?: string
    voiceId?: string
    isPaid?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, themeId, voiceId, isPaid } = body
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const updates: Partial<typeof users.$inferInsert> = {
    lastActiveAt: new Date(),
  }
  if (themeId !== undefined) updates.themeId = themeId
  if (voiceId !== undefined) updates.voiceId = voiceId
  if (isPaid !== undefined) updates.isPaid = isPaid

  try {
    await db.update(users).set(updates).where(eq(users.id, userId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] user PATCH error:", err)
    return NextResponse.json({ error: "failed to update user" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// DELETE — delete user and all data
// ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  let body: { userId: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId } = body
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const { intakeSessions, intakePortraits, intakeMessages, notifications } = await import("@/lib/db/schema")
    // cascade delete — sessions, portraits, messages, notifications
    const sessions = await db.select().from(intakeSessions).where(eq(intakeSessions.userId, userId))
    for (const session of sessions) {
      await db.delete(intakeMessages).where(eq(intakeMessages.sessionId, session.id))
      await db.delete(intakePortraits).where(eq(intakePortraits.sessionId, session.id))
    }
    await db.delete(intakeSessions).where(eq(intakeSessions.userId, userId))
    await db.delete(notifications).where(eq(notifications.userId, userId))
    await db.delete(users).where(eq(users.id, userId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] user DELETE error:", err)
    return NextResponse.json({ error: "failed to delete user" }, { status: 500 })
  }
}
