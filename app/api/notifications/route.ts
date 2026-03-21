/**
 * GET /api/notifications?userId=...
 * PATCH /api/notifications — mark as read
 */
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { v4 as uuid } from "uuid"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    // seed welcome notification if none exist
    if (rows.length === 0) {
      const now = new Date()
      const welcomeId = uuid()
      await db.insert(notifications).values({
        id: welcomeId,
        userId,
        category: "update",
        content: "welcome to [us]. your portrait is the foundation of everything here. [u] is listening.",
        read: false,
        relatedId: null,
        createdAt: now,
      })
      return NextResponse.json({
        notifications: [{
          id: welcomeId,
          userId,
          category: "update",
          content: "welcome to [us]. your portrait is the foundation of everything here. [u] is listening.",
          read: false,
          relatedId: null,
          createdAt: now,
        }]
      })
    }

    return NextResponse.json({ notifications: rows })
  } catch (err) {
    console.error("[us] notifications GET error:", err)
    return NextResponse.json({ error: "failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  let body: { userId: string; notificationId?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, notificationId } = body
  try {
    if (notificationId) {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId))
    } else {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] notifications PATCH error:", err)
    return NextResponse.json({ error: "failed to mark read" }, { status: 500 })
  }
}
