/**
 * POST /api/matches/connect
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matchScores, conversations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { generateFirstPrompt } from "@/lib/match/firstPrompt"

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

    await db.update(matchScores).set({ status: "connected", updatedAt: now }).where(eq(matchScores.id, matchId))

    const [mirrorMatch] = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.userIdA, targetUserId), eq(matchScores.userIdB, userId), eq(matchScores.status, "connected")))
      .limit(1)

    if (!mirrorMatch) return NextResponse.json({ mutual: false })

    const [existingConvo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userIdA, userId), eq(conversations.userIdB, targetUserId)))
      .limit(1)

    if (existingConvo) {
      return NextResponse.json({ mutual: true, conversationId: existingConvo.id, firstPrompt: existingConvo.firstPrompt })
    }

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
