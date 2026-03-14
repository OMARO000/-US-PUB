/**
 * [us] intake session manager
 *
 * In-memory session state during conversation.
 * Persists to SQLite on block completion and on session complete.
 *
 * Usage:
 *   const session = SessionManager.get(sessionId)
 *   session.addMessage({ role: "user", content: "...", blockId: 2 })
 *   await session.completeBlock(2)
 *   await session.persist()
 */
import { v4 as uuid } from "uuid"
import { db } from "@/lib/db"
import {
  intakeSessions,
  intakeMessages,
  intakePortraits,
} from "@/lib/db/schema"
import {
  type BlockId,
  drawArrivalStatement,
  getNextBlock,
} from "@/lib/intake/blocks"
import { eq } from "drizzle-orm"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface SessionMessage {
  id: string
  role: "them" | "user"
  content: string
  blockId: BlockId | null
  isRephrase: boolean
  rephraseIndex: number | null
  inputMode: "voice" | "text" | null
  audioDurationMs: number | null
  createdAt: Date
}

export interface SessionState {
  id: string
  userId: string
  arrivalStatement: string
  currentBlock: BlockId
  block4Accepted: boolean
  blocksCompleted: BlockId[]
  status: "active" | "completed" | "abandoned"
  messages: SessionMessage[]
  startedAt: Date
  lastActivityAt: Date
  completedAt: Date | null
  portraitId: string | null
  // dirty tracking — which messages haven't been persisted yet
  _unpersisted: SessionMessage[]
}

// ─────────────────────────────────────────────
// IN-MEMORY STORE
// ─────────────────────────────────────────────
const store = new Map<string, SessionState>()

// ─────────────────────────────────────────────
// SESSION MANAGER
// ─────────────────────────────────────────────
export const SessionManager = {
  /**
   * Create a brand new intake session.
   */
  async create(userId: string): Promise<SessionState> {
    const id = uuid()
    const now = new Date()
    const arrivalStatement = drawArrivalStatement()
    const state: SessionState = {
      id,
      userId,
      arrivalStatement,
      currentBlock: 1,
      block4Accepted: false,
      blocksCompleted: [],
      status: "active",
      messages: [],
      startedAt: now,
      lastActivityAt: now,
      completedAt: null,
      portraitId: null,
      _unpersisted: [],
    }
    store.set(id, state)
    // persist session row immediately
    await db.insert(intakeSessions).values({
      id,
      userId,
      arrivalStatement,
      currentBlock: 1,
      block4Accepted: false,
      blocksCompleted: "[]",
      status: "active",
      startedAt: now,
      lastActivityAt: now,
      completedAt: null,
      portraitId: null,
    })
    return state
  },

  /**
   * Get an active session from memory, or rehydrate from DB.
   */
  async get(sessionId: string): Promise<SessionState | null> {
    if (store.has(sessionId)) {
      return store.get(sessionId)!
    }
    // rehydrate from DB
    const [row] = await db
      .select()
      .from(intakeSessions)
      .where(eq(intakeSessions.id, sessionId))
      .limit(1)
    if (!row) return null
    const messages = await db
      .select()
      .from(intakeMessages)
      .where(eq(intakeMessages.sessionId, sessionId))
    const state: SessionState = {
      id: row.id,
      userId: row.userId,
      arrivalStatement: row.arrivalStatement,
      currentBlock: row.currentBlock as BlockId,
      block4Accepted: row.block4Accepted,
      blocksCompleted: JSON.parse(row.blocksCompleted) as BlockId[],
      status: row.status as SessionState["status"],
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role as "them" | "user",
        content: m.content,
        blockId: m.blockId as BlockId | null,
        isRephrase: m.isRephrase,
        rephraseIndex: m.rephraseIndex ?? null,
        inputMode: m.inputMode as "voice" | "text" | null,
        audioDurationMs: m.audioDurationMs ?? null,
        createdAt: new Date(m.createdAt),
      })),
      startedAt: new Date(row.startedAt),
      lastActivityAt: new Date(row.lastActivityAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      portraitId: row.portraitId ?? null,
      _unpersisted: [],
    }
    store.set(sessionId, state)
    return state
  },

  /**
   * Add a message to the in-memory session.
   * Marks it as unpersisted — caller decides when to flush.
   */
  addMessage(
    sessionId: string,
    msg: Omit<SessionMessage, "id" | "createdAt">
  ): SessionMessage {
    const state = store.get(sessionId)
    if (!state) throw new Error(`[us] session not found: ${sessionId}`)
    const full: SessionMessage = {
      ...msg,
      id: uuid(),
      createdAt: new Date(),
    }
    state.messages.push(full)
    state._unpersisted.push(full)
    state.lastActivityAt = new Date()
    return full
  },

  /**
   * Mark a block as completed. Advances currentBlock.
   * Persists block completion + all unpersisted messages to DB.
   */
  async completeBlock(
    sessionId: string,
    blockId: BlockId
  ): Promise<void> {
    const state = store.get(sessionId)
    if (!state) throw new Error(`[us] session not found: ${sessionId}`)
    if (!state.blocksCompleted.includes(blockId)) {
      state.blocksCompleted.push(blockId)
    }
    const nextBlock = getNextBlock(blockId, state.block4Accepted)
    if (nextBlock) {
      state.currentBlock = nextBlock
    }
    await SessionManager._flush(state)
  },

  /**
   * User accepts Block 4 (the optional depth block).
   */
  acceptBlock4(sessionId: string): void {
    const state = store.get(sessionId)
    if (!state) throw new Error(`[us] session not found: ${sessionId}`)
    state.block4Accepted = true
  },

  /**
   * Complete the full intake session.
   * Persists everything and clears from memory after a short delay.
   */
  async complete(sessionId: string): Promise<void> {
    const state = store.get(sessionId)
    if (!state) throw new Error(`[us] session not found: ${sessionId}`)
    state.status = "completed"
    state.completedAt = new Date()
    await SessionManager._flush(state)
    // keep in memory briefly for portrait generation, then evict
    setTimeout(() => store.delete(sessionId), 60_000)
  },

  /**
   * Abandon an active session.
   */
  async abandon(sessionId: string): Promise<void> {
    const state = store.get(sessionId)
    if (!state) return
    state.status = "abandoned"
    await SessionManager._flush(state)
    store.delete(sessionId)
  },

  /**
   * Save the generated portrait and mark session ready for matching.
   */
  async savePortrait(
    sessionId: string,
    portrait: {
      portraitText: string
      valuesSignals: string[]
      narrativeSignals: string[]
      relationalSignals: string[]
      communicationSignals: string[]
      frictionSignals: string[]
      connectionType: "romantic" | "platonic" | "professional" | "open"
    }
  ): Promise<string> {
    const state = store.get(sessionId)
    if (!state) throw new Error(`[us] session not found: ${sessionId}`)
    const portraitId = uuid()
    const now = new Date()
    await db.insert(intakePortraits).values({
      id: portraitId,
      sessionId,
      userId: state.userId,
      portraitText: portrait.portraitText,
      valuesSignals: JSON.stringify(portrait.valuesSignals),
      narrativeSignals: JSON.stringify(portrait.narrativeSignals),
      relationalSignals: JSON.stringify(portrait.relationalSignals),
      communicationSignals: JSON.stringify(portrait.communicationSignals),
      frictionSignals: JSON.stringify(portrait.frictionSignals),
      connectionType: portrait.connectionType,
      readyForMatching: false,
      createdAt: now,
      updatedAt: now,
    })
    state.portraitId = portraitId
    await db
      .update(intakeSessions)
      .set({ portraitId, lastActivityAt: now })
      .where(eq(intakeSessions.id, sessionId))
    return portraitId
  },

  /**
   * Internal: flush unpersisted messages + update session row.
   */
  async _flush(state: SessionState): Promise<void> {
    const now = new Date()
    // persist unpersisted messages
    if (state._unpersisted.length > 0) {
      await db.insert(intakeMessages).values(
        state._unpersisted.map((m) => ({
          id: m.id,
          sessionId: state.id,
          role: m.role,
          content: m.content,
          blockId: m.blockId,
          isRephrase: m.isRephrase,
          rephraseIndex: m.rephraseIndex,
          inputMode: m.inputMode,
          audioDurationMs: m.audioDurationMs,
          createdAt: m.createdAt,
        }))
      )
      state._unpersisted = []
    }
    // update session row
    await db
      .update(intakeSessions)
      .set({
        currentBlock: state.currentBlock,
        block4Accepted: state.block4Accepted,
        blocksCompleted: JSON.stringify(state.blocksCompleted),
        status: state.status,
        lastActivityAt: now,
        completedAt: state.completedAt ?? null,
        portraitId: state.portraitId ?? null,
      })
      .where(eq(intakeSessions.id, state.id))
  },
}
