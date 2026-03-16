CREATE TABLE `custodial_wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`public_key` text NOT NULL,
	`encrypted_private_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `intake_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`block_id` integer,
	`is_rephrase` integer DEFAULT false NOT NULL,
	`rephrase_index` integer,
	`input_mode` text,
	`audio_duration_ms` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `intake_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `intake_portraits` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`portrait_text` text NOT NULL,
	`values_signals` text DEFAULT '[]' NOT NULL,
	`narrative_signals` text DEFAULT '[]' NOT NULL,
	`relational_signals` text DEFAULT '[]' NOT NULL,
	`communication_signals` text DEFAULT '[]' NOT NULL,
	`friction_signals` text DEFAULT '[]' NOT NULL,
	`connection_type` text DEFAULT 'open' NOT NULL,
	`user_confirmed` integer,
	`user_corrections` text,
	`ready_for_matching` integer DEFAULT false NOT NULL,
	`archetype` text,
	`secondary_archetype` text,
	`metaphor_text` text,
	`mint_address` text,
	`mint_tx_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `intake_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `intake_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`arrival_statement` text NOT NULL,
	`current_block` integer DEFAULT 1 NOT NULL,
	`block4_accepted` integer DEFAULT false NOT NULL,
	`blocks_completed` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`completed_at` integer,
	`portrait_id` text
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`input_mode` text NOT NULL,
	`you_prompt` text,
	`allow_you_access` integer DEFAULT false NOT NULL,
	`audio_duration_ms` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
