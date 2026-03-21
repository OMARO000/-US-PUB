/**
 * POST /api/matches/connect
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matchScores, conversations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { generateFirstPrompt } from "@/lib/match/firstPrompt"
import { createNotification } from "@/lib/notifications/create"

export async function POST(req: NextRequest) {
  let body: { matchId: string; userId: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid request" }, { status: 400 }) }

  const { matchId, userId } = body
  if (!matchId || !userId) return NextResponse.json({ error: "matchId and userId required" }, { status: 400 })

  try {
    const now = new Date()

    const [matchRow] = await db.select().from(matchScores).where(eq(matchScores.id, matchId)).limit(1)
    if (!matchRow) return NextResponse.json({ error: "match not found" }, { status: 404 })

    const targetUserId = matchRow.userIdB

    // mark this user's row as connected
    await db.update(matchScores).set({ status: "connected", updatedAt: now }).where(eq(matchScores.id, matchId))

    // set intentSignal = true on mirror row (B→A) to elevate visibility
    // does not reveal that A connected — just surfaces the match higher in B's list
    await db
      .update(matchScores)
      .set({ intentSignal: true, updatedAt: now })
      .where(and(eq(matchScores.userIdA, targetUserId), eq(matchScores.userIdB, userId)))

    // check for mirror match (target → user, status = connected)
    const [mirrorMatch] = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.userIdA, targetUserId), eq(matchScores.userIdB, userId), eq(matchScores.status, "connected")))
      .limit(1)

    if (!mirrorMatch) return NextResponse.json({ mutual: false })

    await createNotification(userId, "connection", "a mutual connection opened. check your [connections].")
    await createNotification(targetUserId, "connection", "a mutual connection opened. check your [connections].")

    // check if conversation already exists
    const [existingConvo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userIdA, userId), eq(conversations.userIdB, targetUserId)))
      .limit(1)

    if (existingConvo) {
      return NextResponse.json({ mutual: true, conversationId: existingConvo.id, firstPrompt: existingConvo.firstPrompt })
    }

    // create new conversation
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

    const firstPrompt = await generateFirstPrompt(conversationId)
    return NextResponse.json({ mutual: true, conversationId, firstPrompt })
  } catch (err) {
    console.error("[us] matches/connect error:", err)
    return NextResponse.json({ error: "failed to process connection" }, { status: 500 })
  }
}
