import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getThreadConfig, type ThreadType } from "@/lib/threads/threadPrompts"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  let body: {
    threadId: string
    threadType: ThreadType
    userId: string
    message: string
    history: { role: "user" | "assistant"; content: string }[]
  }

  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid request" }, { status: 400 }) }

  const { threadType, message, history } = body
  const config = getThreadConfig(threadType)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await client.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: config.systemPrompt,
          messages: [
            ...history,
            { role: "user", content: message },
          ],
        })

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`)
            )
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err) {
        console.error("[us] thread chat error:", err)
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
