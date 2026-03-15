/**
 * [us] intake conversation engine — block definitions + arrival pool
 *
 * 32 arrival statements: drawn randomly on first open, one per user.
 * 8 blocks: invisible to user. One flowing conversation.
 * Block 4 is optional and user-led.
 * Block 8 generates the dynamic portrait.
 */
// ─────────────────────────────────────────────
// ARRIVAL POOL
// 32 statements. One drawn at random on first open.
// These are [them]'s opening line — not a question.
// Presence, not projection. Inviting, not interrogating.
// ─────────────────────────────────────────────
export const ARRIVAL_POOL: string[] = [
  "you showed up.",
  "something brought you here.",
  "i've been waiting — not for anyone specific. just for whoever came.",
  "there's no right way to start.",
  "you don't have to know what you're looking for yet.",
  "most people hesitate before they open something like this.",
  "the fact that you're here already says something.",
  "we can go slow.",
  "i'm not going anywhere.",
  "you can be exactly as you are right now.",
  "nothing you say here will surprise me.",
  "this is yours. we go wherever you want to go.",
  "you don't need to explain yourself to start.",
  "some people come here knowing exactly what they need. others don't. both are fine.",
  "there's no version of you that's wrong for this.",
  "i notice you're here.",
  "whatever's on your mind right now — that's a good place to begin.",
  "you can be honest here, even if you're not sure what honest looks like yet.",
  "i'm not going to rush you.",
  "the door was open. you walked through it.",
  "you chose to come here. that choice matters.",
  "we have time.",
  "this doesn't have to be profound. it just has to be real.",
  "people come here for a lot of different reasons. there's no wrong one.",
  "start wherever feels true.",
  "you don't have to be ready. you just have to be here.",
  "i'm listening — not evaluating.",
  "whatever brought you doesn't have to be explained. we can just begin.",
  "you're allowed to not know what you want from this.",
  "take a breath. we're in no hurry.",
  "i won't pretend i know why you came. but i'm glad you did.",
  "this is the beginning of something.",
]

export function drawArrivalStatement(): string {
  return ARRIVAL_POOL[Math.floor(Math.random() * ARRIVAL_POOL.length)]
}

// ─────────────────────────────────────────────
// BLOCK DEFINITIONS
// 8 blocks. Invisible to user — no labels, no progress.
// Each block has: a purpose, 3 rephrasable opening prompts,
// and transition logic for [them] to follow.
// ─────────────────────────────────────────────
export type BlockId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface IntakeBlock {
  id: BlockId
  purpose: string           // internal only — what this block extracts
  optional: boolean         // only Block 4
  userLed: boolean          // if true, user must signal readiness to enter
  minExchanges: number      // minimum back-and-forths before block can close
  maxExchanges: number      // soft ceiling — [them] can extend if signal is incomplete
  openingPrompts: [string, string, string]  // 3 rephrasable options
  completionSignal: string  // internal note on what "done" looks like
}

export const BLOCKS: Record<BlockId, IntakeBlock> = {
  1: {
    id: 1,
    purpose: "Orientation — what draws them, what they're open to, pace-setting",
    optional: false,
    userLed: false,
    minExchanges: 2,
    maxExchanges: 5,
    openingPrompts: [
      "what made you open this?",
      "what's on your mind about being here?",
      "what are you hoping for — even vaguely?",
    ],
    completionSignal: "User has expressed at least one felt motivation or orientation. Can be indirect.",
  },
  2: {
    id: 2,
    purpose: "Values + what matters — core beliefs, what they protect, what they can't compromise",
    optional: false,
    userLed: false,
    minExchanges: 3,
    maxExchanges: 7,
    openingPrompts: [
      "what matters most to you — not what should matter. what actually does.",
      "if someone wanted to understand who you really are, what would you want them to know first?",
      "what do you find yourself protecting, even when it's hard?",
    ],
    completionSignal: "At least one concrete value or non-negotiable has been named or clearly implied.",
  },
  3: {
    id: 3,
    purpose: "Narrative + aspiration — where they're going, what they're building toward, growth edge",
    optional: false,
    userLed: false,
    minExchanges: 2,
    maxExchanges: 6,
    openingPrompts: [
      "where are you trying to go right now — in your life, not just in who you're looking for?",
      "what's something you're in the middle of becoming?",
      "what does a year from now look like if things go the way you hope?",
    ],
    completionSignal: "A directional signal — aspiration, movement, or growth edge — has been expressed.",
  },
  4: {
    id: 4,
    purpose: "Friction + repair — how they handle difficulty, rupture, conflict. Optional, user-led.",
    optional: true,
    userLed: true,
    minExchanges: 2,
    maxExchanges: 5,
    openingPrompts: [
      "can i ask you something harder?",
      "there's something i'm curious about — you can skip it if you want.",
      "want to go somewhere a little more honest?",
    ],
    completionSignal: "User engages with at least one friction/repair signal. Opt-out is also valid data.",
  },
  5: {
    id: 5,
    purpose: "Relational style — attachment signals, what they give/need in connection, reciprocity",
    optional: false,
    userLed: false,
    minExchanges: 3,
    maxExchanges: 7,
    openingPrompts: [
      "what does it feel like when a connection is working?",
      "how do you know when someone really sees you?",
      "what do you tend to give in relationships — before you even think about it?",
    ],
    completionSignal: "Relational style or attachment orientation implied through behavioral description.",
  },
  6: {
    id: 6,
    purpose: "Communication style — how they express, what they notice, how they handle friction in language",
    optional: false,
    userLed: false,
    minExchanges: 2,
    maxExchanges: 5,
    openingPrompts: [
      "how do you tend to communicate when something actually matters to you?",
      "what does it look like when you're really trying to be understood?",
      "when something's hard to say — how do you usually handle that?",
    ],
    completionSignal: "Communication orientation — direct/indirect, verbal/behavioral — is legible.",
  },
  7: {
    id: 7,
    purpose: "Connection type + context — romantic, platonic, professional clarification; life context",
    optional: false,
    userLed: false,
    minExchanges: 2,
    maxExchanges: 4,
    openingPrompts: [
      "what kind of connection are you looking for — or open to?",
      "is there a type of relationship that feels most present for you right now?",
      "romantic, platonic, professional — or some mix? what feels true?",
    ],
    completionSignal: "Connection type has been named or clearly implied. Life context anchored.",
  },
  8: {
    id: 8,
    purpose: "Portrait generation — synthesis moment. [them] reflects back. User confirms or corrects.",
    optional: false,
    userLed: false,
    minExchanges: 1,
    maxExchanges: 3,
    openingPrompts: [
      "i want to try something. let me tell you what i've heard — and you tell me what lands.",
      "before we finish, i want to reflect something back to you.",
      "i've been listening. can i say what i notice?",
    ],
    completionSignal: "Portrait delivered. User has responded — confirmed, corrected, or added to it.",
  },
}

export const BLOCK_ORDER: BlockId[] = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Returns the next block in sequence.
 * Block 4 is skipped unless the user explicitly opts in via [them]'s prompt.
 */
export function getNextBlock(
  current: BlockId,
  block4Accepted: boolean
): BlockId | null {
  const order = block4Accepted
    ? BLOCK_ORDER
    : BLOCK_ORDER.filter((id) => id !== 4)
  const idx = order.indexOf(current)
  if (idx === -1 || idx === order.length - 1) return null
  return order[idx + 1]
}
