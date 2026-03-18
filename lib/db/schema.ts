/**
 * [us] database schema
 *
 * Tables:
 *   intake_sessions     — one per user per intake attempt
 *   intake_messages     — every exchange during intake
 *   intake_portraits    — final portrait generated at Block 8
 *   custodial_wallets   — Solana wallets created on behalf of users
 *   journal_entries     — private user reflections
 */

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
// USERS
// Anonymous — no PII. Mullvad-style account number.
// ─────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),               // uuid — same as us_uid in localStorage
  accountNumber: text("account_number").notNull().unique(), // 16-digit anonymous ID
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).notNull(),

  // preferences (set during onboarding)
  themeId: text("theme_id").notNull().default("charcoal"),
  voiceId: text("voice_id"),

  // subscription
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
  paidSince: integer("paid_since", { mode: "timestamp" }),
})

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
  // archetype classification
  archetype: text("archetype"),
  secondaryArchetype: text("secondary_archetype"),
  metaphorText: text("metaphor_text"),
  // NFT mint record
  mintAddress: text("mint_address"),
  mintTxUrl: text("mint_tx_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// CUSTODIAL WALLETS
// Solana keypairs generated on behalf of users
// who don't have their own wallet at mint time.
// Private key is AES-256 encrypted before storage.
// User can export from [profile] at any time.
// ─────────────────────────────────────────────
export const custodialWallets = sqliteTable("custodial_wallets", {
  id: text("id").primaryKey(),                        // uuid
  userId: text("user_id").notNull(),
  publicKey: text("public_key").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),  // AES-256 encrypted
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// JOURNAL ENTRIES
// Private user reflections. Never shared without
// explicit consent (allowYouAccess).
// ─────────────────────────────────────────────
export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),                        // uuid
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  inputMode: text("input_mode", { enum: ["voice", "text"] }).notNull(),
  youPrompt: text("you_prompt"),                      // the [u] prompt that sparked this entry
  allowYouAccess: integer("allow_you_access", { mode: "boolean" })
    .notNull()
    .default(false),
  audioDurationMs: integer("audio_duration_ms"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// MATCH SCORES
// Stores computed match scores between user pairs.
// Recalculated when either user updates their portrait.
// ─────────────────────────────────────────────
export const matchScores = sqliteTable("match_scores", {
  id: text("id").primaryKey(),

  userIdA: text("user_id_a").notNull(),
  userIdB: text("user_id_b").notNull(),

  connectionType: text("connection_type", {
    enum: ["romantic", "platonic", "professional", "open"],
  }).notNull(),

  // scores — stored but never shown to users
  totalScore: real("total_score").notNull(),

  // layer scores as JSON
  layerScores: text("layer_scores").notNull().default("{}"),

  // resonance signals — shown to users
  resonanceSignals: text("resonance_signals").notNull().default("[]"),
  mutualSignals: text("mutual_signals").notNull().default("[]"),

  // archetypes
  archetypeA: text("archetype_a"),
  archetypeB: text("archetype_b"),

  // go deeper
  goDeeper: integer("go_deeper", { mode: "boolean" }).notNull().default(false),
  intentSignal: integer("intent_signal", { mode: "boolean" }).notNull().default(false),

  // status
  status: text("status", {
    enum: ["pending", "shown", "connected", "not_a_fit"],
  }).notNull().default("pending"),

  // outcome tracking
  outcomeRecorded: integer("outcome_recorded", { mode: "boolean" }).notNull().default(false),

  // timestamps
  scoredAt: integer("scored_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// CONVERSATIONS
// Created when two users mutually connect.
// firstPrompt is generated by [u] as an opening context.
// ─────────────────────────────────────────────
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),                        // uuid
  userIdA: text("user_id_a").notNull(),
  userIdB: text("user_id_b").notNull(),
  status: text("status", {
    enum: ["active", "ended"],
  }).notNull().default("active"),
  firstPrompt: text("first_prompt"),                  // [u]-generated opening context, nullable
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// MATCH OUTCOMES
// Reported after a conversation ends.
// One row per user per conversation (each party reports independently).
// ─────────────────────────────────────────────
export const matchOutcomes = sqliteTable("match_outcomes", {
  id: text("id").primaryKey(),                        // uuid
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),                  // who is reporting
  outcome: text("outcome", {
    enum: ["met", "didnt_meet", "ongoing"],
  }).notNull(),
  rating: integer("rating"),                          // 1–5, nullable
  notes: text("notes"),                               // free text, nullable
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─────────────────────────────────────────────
// THREADS
// Persistent [u] conversations scoped to a topic.
// One thread per user per thread type.
// ─────────────────────────────────────────────
export const threads = sqliteTable("threads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  threadType: text("thread_type").notNull(), // conversation, connections, insights, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).notNull(),
})

export const threadMessages = sqliteTable("thread_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["you", "user"] }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),  // JSON — for MATCH_CARD, SETTING_UPDATE etc
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})
