/**
 * [them] rephrase system
 *
 * When a user taps [rephrase], this generates 3 alternative phrasings
 * of the current [them] prompt — same intent, different approach/energy.
 *
 * Rules:
 * - Same underlying ask, never a different question
 * - Vary: directness, warmth, brevity, angle of entry
 * - All three must pass tone rules (presence not projection, no assumed backstory)
 * - Returned as an array of 3 strings — UI picks up from there
 * - If generation fails, fall back to the original prompt (never show an error)
 */
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const REPHRASE_SYSTEM = `\
You generate alternative phrasings for an intake conversation prompt.
The original prompt has a specific intent. Your job is to express the same intent
three different ways — varying energy, directness, warmth, or angle of entry.

Rules:
- Same underlying question or invitation. Never a different one.
- All three must be short. 1–2 sentences max each.
- All three must feel natural when spoken aloud.
- Do not use bullet points, numbering, or any formatting.
- Return exactly 3 options separated by the delimiter: |||
- No preamble. No explanation. Just the three options.
- Tone: warm, unhurried, genderless. No performance. No hollow phrases.
- Do not assume anything about the person's history, wounds, or experience.

Example output format:
what does that feel like for you?|||tell me more about that.|||that sounds like it matters — what's underneath it?`

export async function generateRephrases(
  originalPrompt: string,
  blockPurpose: string
): Promise<[string, string, string]> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: REPHRASE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Block purpose: ${blockPurpose}\n\nOriginal prompt: ${originalPrompt}\n\nGenerate 3 rephrases.`,
        },
      ],
    })

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()

    const parts = text.split("|||").map((s) => s.trim()).filter(Boolean)

    if (parts.length >= 3) {
      return [parts[0], parts[1], parts[2]]
    }

    // fallback: pad with original if not enough parts
    const fallback = originalPrompt
    return [
      parts[0] ?? fallback,
      parts[1] ?? fallback,
      parts[2] ?? fallback,
    ]
  } catch {
    // silent fallback — never expose an error to the user
    return [originalPrompt, originalPrompt, originalPrompt]
  }
}
