import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { v4 as uuid } from "uuid"

export async function POST(req: NextRequest) {
  let body: { threadId: string; role: string; content: string; metadata?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { threadId, role: roleRaw, content, metadata } = body
  const role = roleRaw as "user" | "you"
  if (!threadId || !role || !content) {
    return NextResponse.json({ error: "threadId, role, content required" }, { status: 400 })
  }

  try {
    const now = new Date()

    await db.insert(threadMessages).values({
      id: uuid(),
      threadId,
      role,
      content,
      metadata: metadata ?? null,
      createdAt: now,
    })

    await db
      .update(threads)
      .set({ lastActiveAt: now })
      .where(eq(threads.id, threadId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] threads message error:", err)
    return NextResponse.json({ error: "failed to save message" }, { status: 500 })
  }
}
