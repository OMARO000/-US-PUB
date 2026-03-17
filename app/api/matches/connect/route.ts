/**
 * POST /api/matches/connect
 *
 * Body: { matchId, userId }
 *
 * 1. Updates match_scores status to "connected" for this user's row.
 * 2. Looks for mirror match (userIdA = targetUserId, userIdB = userId, status = "connected").
 * 3. If mutual — creates a conversations row, returns { mutual: true, conversationId }.
 * 4. If not mutual — returns { mutual: false }.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matchScores, conversations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { generateFirstPrompt } from "@/lib/match/firstPrompt"

export async function POST(req: NextRequest) {
  let body: { matchId: string; userId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { matchId, userId } = body
  if (!matchId || !userId) {
    return NextResponse.json({ error: "matchId and userId required" }, { status: 400 })
  }

  try {
    const now = new Date()

    // ── get this user's match row ──
    const [userMatch] = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.id, matchId))
      .limit(1)

    if (!userMatch) {
      return NextResponse.json({ error: "match not found" }, { status: 404 })
    }

    const targetUserId = userMatch.userIdB

    // ── mark this user as connected ──
    await db
      .update(matchScores)
      .set({ status: "connected", updatedAt: now })
      .where(eq(matchScores.id, matchId))

    // ── check for mirror connect ──
    const [mirrorMatch] = await db
      .select()
      .from(matchScores)
      .where(
        and(
          eq(matchScores.userIdA, targetUserId),
          eq(matchScores.userIdB, userId),
          eq(matchScores.status, "connected")
        )
      )
      .limit(1)

    if (!mirrorMatch) {
      return NextResponse.json({ mutual: false })
    }

    // ── mutual connect — check if conversation already exists ──
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userIdA, userId),
          eq(conversations.userIdB, targetUserId)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json({ mutual: true, conversationId: existing.id })
    }

    // ── create conversation ──
    const conversationId = uuid()
    await db.insert(conversations).values({
      id: conversationId,
      userIdA: userId,
      userIdB: targetUserId,
      status: "active",
      firstPrompt: null,
      createdAt: now,
      updatedAt: now,
    })

    // ── generate opening prompt ──
    let firstPrompt: string | null = null
    try {
      firstPrompt = await generateFirstPrompt(conversationId)
    } catch (err) {
      console.error("[us] generateFirstPrompt error:", err)
    }

    return NextResponse.json({ mutual: true, conversationId, firstPrompt })
  } catch (err) {
    console.error("[us] matches/connect error:", err)
    return NextResponse.json({ error: "failed to process connect" }, { status: 500 })
  }
}
