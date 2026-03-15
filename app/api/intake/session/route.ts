/**
 * POST /api/intake/session
 *
 * Creates a new intake session.
 * Draws arrival statement, persists session row, returns init payload.
 *
 * GET /api/intake/session?sessionId=...
 * Returns current session state for UI resume.
 */
import { NextRequest, NextResponse } from "next/server"
import { SessionManager } from "@/lib/intake/session"

// ─────────────────────────────────────────────
// POST — create new session
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { userId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId } = body
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    const session = await SessionManager.create(userId)
    return NextResponse.json({
      sessionId: session.id,
      arrivalStatement: session.arrivalStatement,
      currentBlock: session.currentBlock,
      status: session.status,
    })
  } catch (err) {
    console.error("[us] session create error:", err)
    return NextResponse.json({ error: "failed to create session" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// GET — resume existing session
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  const session = await SessionManager.get(sessionId)
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  return NextResponse.json({
    sessionId: session.id,
    arrivalStatement: session.arrivalStatement,
    currentBlock: session.currentBlock,
    blocksCompleted: session.blocksCompleted,
    block4Accepted: session.block4Accepted,
    status: session.status,
    portraitId: session.portraitId,
    messageCount: session.messages.length,
  })
}
