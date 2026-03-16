/**
 * POST /api/journal/entry
 * Creates a new journal entry for the current user.
 *
 * GET /api/journal/entries?userId=...
 * Returns all journal entries for a user, newest first.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { journalEntries } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { v4 as uuid } from "uuid"

// ─────────────────────────────────────────────
// POST — create entry
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    userId: string
    content: string
    inputMode: "voice" | "text"
    youPrompt?: string
    allowYouAccess?: boolean
    audioDurationMs?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, content, inputMode, youPrompt, allowYouAccess, audioDurationMs } = body

  if (!userId || !content || !inputMode) {
    return NextResponse.json({ error: "userId, content, inputMode required" }, { status: 400 })
  }

  const now = new Date()
  const id = uuid()

  try {
    await db.insert(journalEntries).values({
      id,
      userId,
      content,
      inputMode,
      youPrompt: youPrompt ?? null,
      allowYouAccess: allowYouAccess ?? false,
      audioDurationMs: audioDurationMs ?? null,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error("[us] journal entry create error:", err)
    return NextResponse.json({ error: "failed to save entry" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// GET — fetch entries
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))

    return NextResponse.json({ entries })
  } catch (err) {
    console.error("[us] journal entries fetch error:", err)
    return NextResponse.json({ error: "failed to fetch entries" }, { status: 500 })
  }
}
