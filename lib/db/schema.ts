/**
 * [us] schema extension — intake sessions
 *
 * Extends existing schema with:
 *   intake_sessions    — one per user, tracks full conversation
 *   intake_messages    — every exchange during intake
 *   intake_portraits   — final portrait generated at Block 8
 *
 * Add these tables to your existing schema.ts.
 * Import and include them in your db index alongside existing tables.
 */
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

// ─────────────────────────────────────────────
// INTAKE SESSIONS
// One row per user per intake attempt.
// completed_at null = session in progress.
// ─────────────────────────────────────────────
export const intakeSessions = sqliteTable("intake_sessions", {
  id: text("id").primaryKey(),                        // uuid
  userId: text("user_id").notNull(),                  // anonymous user id from existing users table
  // arrival
  arrivalStatement: text("arrival_statement").notNull(), // which statement was drawn
  // block progress
  currentBlock: integer("current_block").notNull().default(1),  // 1–8
  block4Accepted: integer("block4_accepted", { mode: "boolean" }).notNull().default(false),
  blocksCompleted: text("blocks_completed").notNull().default("[]"), // JSON array of completed block ids
  // session state
  status: text("status", {
    enum: ["active", "completed", "abandoned"],
  }).notNull().default("active"),
  // timestamps
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  // portrait — persisted after Block 8
  portraitId: text("portrait_id"),                   // FK to intake_portraits
})

// ─────────────────────────────────────────────
// INTAKE MESSAGES
// Every exchange during the intake conversation.
// role: "them" = [them] (AI), "user" = human
// ─────────────────────────────────────────────
export const intakeMessages = sqliteTable("intake_messages", {
  id: text("id").primaryKey(),                        // uuid
  sessionId: text("session_id")
    .notNull()
    .references(() => intakeSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["them", "user"] }).notNull(),
  content: text("content").notNull(),
  // block context
  blockId: integer("block_id"),                       // 1–8, null for arrival/pre-block
  // rephrase tracking
  isRephrase: integer("is_rephrase", { mode: "boolean" }).notNull().default(false),
  rephraseIndex: integer("rephrase_index"),           // 0, 1, or 2
  // voice metadata
  inputMode: text("input_mode", { enum: ["voice", "text"] }),
  audioDurationMs: integer("audio_duration_ms"),      // if voice input
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// INTAKE PORTRAITS
// Generated at Block 8 completion.
// Stored as structured JSON for the match engine.
// ─────────────────────────────────────────────
export const intakePortraits = sqliteTable("intake_portraits", {
  id: text("id").primaryKey(),                        // uuid
  sessionId: text("session_id")
    .notNull()
    .references(() => intakeSessions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  // the portrait text shown to user
  portraitText: text("portrait_text").notNull(),
  // structured signals extracted for match engine
  // stored as JSON strings — parsed at query time
  valuesSignals: text("values_signals").notNull().default("[]"),
  narrativeSignals: text("narrative_signals").notNull().default("[]"),
  relationalSignals: text("relational_signals").notNull().default("[]"),
  communicationSignals: text("communication_signals").notNull().default("[]"),
  frictionSignals: text("friction_signals").notNull().default("[]"),   // block 4, may be empty
  // connection type (from block 7)
  connectionType: text("connection_type", {
    enum: ["romantic", "platonic", "professional", "open"],
  }).notNull().default("open"),
  // user response to portrait (block 8 confirmation exchange)
  userConfirmed: integer("user_confirmed", { mode: "boolean" }),
  userCorrections: text("user_corrections"),          // free text if user amended portrait
  // match engine readiness
  readyForMatching: integer("ready_for_matching", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})
