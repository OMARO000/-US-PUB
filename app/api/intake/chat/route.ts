/**
 * POST /api/intake/chat
 *
 * The [them] conversation engine.
 * Receives a user message, builds block-aware system prompt,
 * calls Claude Sonnet, streams response back.
 *
 * Also handles:
 * - Block advancement detection
 * - Block 4 opt-in tracking
 * - Rephrase requests (POST with rephrase: true)
 * - Session persistence on block complete
 */
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { SessionManager } from "@/lib/intake/session"
import {
  buildSystemPrompt,
  buildConversationSummary,
  shouldAdvanceBlock,
} from "@/lib/intake/them"
import { generateRephrases } from "@/lib/intake/rephrase"
import { BLOCKS, type BlockId } from "@/lib/intake/blocks"
import { generatePortrait } from "@/lib/intake/portrait"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─────────────────────────────────────────────
// REQUEST TYPES
// ─────────────────────────────────────────────
interface ChatRequest {
  sessionId: string
  message: string
  inputMode: "voice" | "text"
  audioDurationMs?: number
  rephrase?: boolean           // if true, generate rephrases instead of continuing
  block4Accept?: boolean       // user explicitly accepted block 4 invitation
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function countExchangesInBlock(
  messages: { role: string; blockId: BlockId | null }[],
  blockId: BlockId
): number {
  return messages.filter(
    (m) => m.blockId === blockId && m.role === "user"
  ).length
}

function isFirstTurnInBlock(
  messages: { role: string; blockId: BlockId | null }[],
  blockId: BlockId
): boolean {
  return !messages.some((m) => m.blockId === blockId)
}

function buildMessageHistory(
  messages: { role: string; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "them")
    .map((m) => ({
      role: m.role === "them" ? "assistant" : "user",
      content: m.content,
    }))
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { sessionId, message, inputMode, audioDurationMs, rephrase, block4Accept } = body

  // ── load session ──
  const session = await SessionManager.get(sessionId)
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 })
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "session not active" }, { status: 409 })
  }

  // ── handle block 4 acceptance ──
  if (block4Accept) {
    SessionManager.acceptBlock4(sessionId)
  }

  // ── add user message to session ──
  const userMsg = SessionManager.addMessage(sessionId, {
    role: "user",
    content: message,
    blockId: session.currentBlock,
    isRephrase: false,
    rephraseIndex: null,
    inputMode,
    audioDurationMs: audioDurationMs ?? null,
  })

  // ── handle rephrase request ──
  if (rephrase) {
    const block = BLOCKS[session.currentBlock]
    // find the last [them] message in this block to rephrase
    const lastThemMsg = [...session.messages]
      .reverse()
      .find((m) => m.role === "them" && m.blockId === session.currentBlock)
    if (!lastThemMsg) {
      return NextResponse.json({ error: "nothing to rephrase" }, { status: 400 })
    }
    const rephrases = await generateRephrases(lastThemMsg.content, block.purpose)
    return NextResponse.json({ rephrases })
  }

  // ── build system prompt ──
  const currentBlock = session.currentBlock
  const block = BLOCKS[currentBlock]
  const exchangesInBlock = countExchangesInBlock(session.messages, currentBlock)
  const firstTurn = isFirstTurnInBlock(session.messages, currentBlock)
  const isPortraitBlock = currentBlock === 8

  const systemPrompt = buildSystemPrompt({
    currentBlock,
    exchangesInCurrentBlock: exchangesInBlock,
    isFirstTurnInBlock: firstTurn,
    isPortraitBlock,
    conversationSummary: isPortraitBlock
      ? buildConversationSummary(session.messages)
      : undefined,
  })

  // ── build message history for API ──
  const history = buildMessageHistory(session.messages)

  // ── stream response from Claude ──
  const encoder = new TextEncoder()
  let fullResponse = ""

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await client.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: systemPrompt,
          messages: history,
        })

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text
            fullResponse += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          }
        }

        // ── add [them] response to session ──
        SessionManager.addMessage(sessionId, {
          role: "them",
          content: fullResponse,
          blockId: currentBlock,
          isRephrase: false,
          rephraseIndex: null,
          inputMode: null,
          audioDurationMs: null,
        })

        // ── check block advancement ──
        const shouldAdvance = shouldAdvanceBlock(block, exchangesInBlock + 1, fullResponse)

        if (shouldAdvance && currentBlock !== 8) {
          await SessionManager.completeBlock(sessionId, currentBlock)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ blockComplete: currentBlock, nextBlock: session.currentBlock })}\n\n`
            )
          )
        } else if (currentBlock === 8) {
          // portrait block — check for completion signal
          const portaitComplete =
            session.messages.filter((m) => m.role === "user" && m.blockId === 8).length >= 1
          if (portaitComplete) {
            await SessionManager.complete(sessionId)
            let portraitData = null
            let accountNumber: string | null = null
            try {
              const portrait = await generatePortrait(session.messages)
              portraitData = {
                portraitText: portrait.portraitText,
                metaphorText: portrait.metaphorText,
                imageKey: portrait.imageKey,
                archetype: portrait.archetype,
                sessionId,
              }
              // persist portrait to DB immediately
              await SessionManager.savePortrait(sessionId, {
                portraitText: portrait.portraitText,
                valuesSignals: [],
                narrativeSignals: [],
                relationalSignals: [],
                communicationSignals: [],
                frictionSignals: [],
                connectionType: "open",
              })
            } catch (err) {
              console.error("[us] portrait generation error:", err)
            }
            try {
              const { getOrCreateUser } = await import("@/lib/users/getOrCreateUser")
              const user = await getOrCreateUser(session.userId)
              accountNumber = user.accountNumber
            } catch (err) {
              console.error("[us] account number fetch error:", err)
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ sessionComplete: true, portraitData, accountNumber })}\n\n`)
            )
          }
        } else {
          // flush unpersisted messages without advancing block
          await SessionManager._flush(session)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err) {
        console.error("[them] stream error:", err)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "stream failed" })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// ─────────────────────────────────────────────
// GET /api/intake/chat?sessionId=...
// Returns current session state (block, status, arrival statement)
// Used by UI to initialize or resume
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
    status: session.status,
    currentBlock: session.currentBlock,
    blocksCompleted: session.blocksCompleted,
    arrivalStatement: session.arrivalStatement,
    block4Accepted: session.block4Accepted,
    portraitId: session.portraitId,
  })
}
