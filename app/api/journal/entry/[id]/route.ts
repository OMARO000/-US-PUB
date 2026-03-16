/**
 * DELETE /api/journal/entry/[id]
 * Deletes a journal entry by ID.
 * Only deletes if the entry belongs to the requesting user.
 *
 * PATCH /api/journal/entry/[id]
 * Updates allowYouAccess on a specific entry.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { journalEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// ─────────────────────────────────────────────
// DELETE — remove entry
// ─────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.nextUrl.searchParams.get("userId")
  const { id } = params

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    await db
      .delete(journalEntries)
      .where(
        and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        )
      )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] journal entry delete error:", err)
    return NextResponse.json({ error: "failed to delete entry" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// PATCH — update allowYouAccess
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  let body: { userId: string; allowYouAccess: boolean }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, allowYouAccess } = body

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    await db
      .update(journalEntries)
      .set({
        allowYouAccess,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        )
      )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] journal entry update error:", err)
    return NextResponse.json({ error: "failed to update entry" }, { status: 500 })
  }
}
