import { pgEnum, pgTable, uuid, text, varchar, integer, timestamp, date, jsonb, numeric, boolean, index, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("status", ["evaluated", "pending", "unavailable"])
export const redditDailyLoungeAnalysisStatus = pgEnum("reddit_daily_lounge_analysis_status", ["pending", "running", "completed", "failed"])
export const redditTipEvaluationMethodVersion = pgEnum("reddit_tip_evaluation_method_version", ["reddit-tip-evaluation-v2", "reddit-tip-evaluation-v3"])
export const redditTipPriceStrategyOutcome = pgEnum("reddit_tip_price_strategy_outcome", ["take-profit", "stop-loss", "ambiguous", "neither"])
export const redditTipTemporalIntent = pgEnum("reddit_tip_temporal_intent", ["same-day", "next-day", "next-trading-day", "specific-date", "multi-day", "unspecified"])
export const shortSqueezeAnalysisStatus = pgEnum("short_squeeze_analysis_status", ["queued", "running", "completed", "partial", "insufficient_data", "failed"])
export const shortSqueezeEvidenceType = pgEnum("short_squeeze_evidence_type", ["filing", "issuer_release", "regulatory", "news", "deterministic"])
export const shortSqueezeFactDomain = pgEnum("short_squeeze_fact_domain", ["instrument", "market", "short_positioning", "borrow", "settlement", "options", "fundamentals", "dilution", "catalyst"])
export const shortSqueezeFactQuality = pgEnum("short_squeeze_fact_quality", ["verified", "estimated", "stale", "conflicted", "missing"])
export const shortSqueezeProgressStage = pgEnum("short_squeeze_progress_stage", ["queued", "collecting_market_data", "collecting_regulatory_data", "extracting_sec_evidence", "calculating_scores", "saving_report", "completed"])
export const investmentResearchProgressStage = pgEnum("investment_research_progress_stage", ["queued", "identifying_instrument", "collecting_market_data", "collecting_regulatory_data", "normalizing_data", "extracting_evidence", "calculating_metrics", "assembling_fact_snapshot", "analyzing_bull", "analyzing_bear", "validating_arguments", "judging", "validating_report", "saving_report", "completed"])
export const investmentResearchStatus = pgEnum("investment_research_status", ["queued", "running", "completed", "partial", "insufficient_data", "failed"])


export const account = pgTable("account", {
	userId: text().notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_pkey"}),
]);

export const investmentResearchRuns = pgTable.withRLS("investment_research_runs", {
	id: uuid().defaultRandom().primaryKey(),
	requestedByUserId: text("requested_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	requestedTicker: varchar("requested_ticker", { length: 20 }).notNull(),
	normalizedTicker: varchar("normalized_ticker", { length: 20 }).notNull(),
	issuerName: varchar("issuer_name", { length: 255 }),
	cik: varchar({ length: 10 }),
	exchange: varchar({ length: 40 }),
	workflowRunId: varchar("workflow_run_id", { length: 255 }),
	status: investmentResearchStatus().default("queued").notNull(),
	progressStage: investmentResearchProgressStage("progress_stage").default("queued").notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
	schemaVersion: varchar("schema_version", { length: 40 }).notNull(),
	methodVersion: varchar("method_version", { length: 80 }).notNull(),
	analysisAsOf: timestamp("analysis_as_of", { withTimezone: true }).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true }),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	factsSnapshot: jsonb("facts_snapshot"),
	bullAnalysis: jsonb("bull_analysis"),
	bearAnalysis: jsonb("bear_analysis"),
	judgeAnalysis: jsonb("judge_analysis"),
	result: jsonb(),
	errorCode: varchar("error_code", { length: 100 }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("investment_research_runs_owner_created_idx").using("btree", table.requestedByUserId.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	index("investment_research_runs_status_created_idx").using("btree", table.status.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	index("investment_research_runs_ticker_created_idx").using("btree", table.normalizedTicker.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	unique("investment_research_runs_user_idempotency_key").on(table.requestedByUserId, table.idempotencyKey),check("investment_research_runs_error_message_length_check", sql`((error_message IS NULL) OR (char_length(error_message) <= 500))`),]);

export const notifications = pgTable.withRLS("notifications", {
	id: uuid().defaultRandom().primaryKey(),
	ticker: varchar({ length: 6 }).notNull(),
	changePercent: integer("change_percent").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	tradingDate: date("trading_date").default(sql`(now() AT TIME ZONE 'America/New_York'::text)`).notNull(),
}, (table) => [
	unique("notifications_ticker_trading_date_key").on(table.ticker, table.tradingDate),]);

export const redditDailyLounges = pgTable.withRLS("reddit_daily_lounges", {
	id: uuid().defaultRandom().primaryKey(),
	loungeDate: varchar("lounge_date", { length: 10 }).notNull(),
	externalRedditPostId: varchar("external_reddit_post_id", { length: 20 }).notNull(),
	analysisStatus: redditDailyLoungeAnalysisStatus("analysis_status").default("pending").notNull(),
	analysisStartedAt: timestamp("analysis_started_at", { withTimezone: true }),
	analysisCompletedAt: timestamp("analysis_completed_at", { withTimezone: true }),
	analysisErrorCode: varchar("analysis_error_code", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	unique("reddit_daily_lounges_external_post_id_key").on(table.externalRedditPostId),	unique("reddit_daily_lounges_lounge_date_key").on(table.loungeDate),]);

export const redditRecognizedTips = pgTable.withRLS("reddit_recognized_tips", {
	id: uuid().defaultRandom().primaryKey(),
	redditUserId: uuid("reddit_user_id").notNull().references(() => redditUsers.id, { onDelete: "restrict" } ),
	externalRedditCommentId: varchar("external_reddit_comment_id", { length: 20 }).notNull(),
	ticker: varchar({ length: 10 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	tipRecordedAt: timestamp("tip_recorded_at", { withTimezone: true }),
	temporalIntent: redditTipTemporalIntent("temporal_intent"),
	targetMarketDate: varchar("target_market_date", { length: 10 }),
}, (table) => [
	index("reddit_recognized_tips_external_comment_id_idx").using("btree", table.externalRedditCommentId.asc().nullsLast()),
	index("reddit_recognized_tips_reddit_user_id_idx").using("btree", table.redditUserId.asc().nullsLast()),
	unique("reddit_recognized_tips_comment_ticker_key").on(table.externalRedditCommentId, table.ticker),]);

export const redditTipPriceEvaluations = pgTable.withRLS("reddit_tip_price_evaluations", {
	id: uuid().defaultRandom().primaryKey(),
	recognizedTipId: uuid("recognized_tip_id").notNull().references(() => redditRecognizedTips.id, { onDelete: "cascade" } ),
	contentHash: varchar("content_hash", { length: 64 }).notNull(),
	status: status().default("pending").notNull(),
	strategyOutcome: redditTipPriceStrategyOutcome("strategy_outcome"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	evaluationMethodVersion: redditTipEvaluationMethodVersion("evaluation_method_version"),
	entryPrice: numeric("entry_price", { precision: 12, scale: 6 }),
	highestPrice: numeric("highest_price", { precision: 12, scale: 6 }),
	lowestPrice: numeric("lowest_price", { precision: 12, scale: 6 }),
	periodEndPrice: numeric("period_end_price", { precision: 12, scale: 6 }),
	periodEndPriceAt: timestamp("period_end_price_at", { withTimezone: true }),
	startPriceAt: timestamp("start_price_at", { withTimezone: true }),
	targetMarketDate: varchar("target_market_date", { length: 10 }),
}, (table) => [
	index("reddit_tip_price_evaluations_status_idx").using("btree", table.status.asc().nullsLast()),
	unique("reddit_tip_price_evaluations_tip_key").on(table.recognizedTipId),]);

export const redditUsers = pgTable.withRLS("reddit_users", {
	id: uuid().defaultRandom().primaryKey(),
	username: varchar({ length: 100 }).notNull(),
	normalizedUsername: varchar("normalized_username", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	unique("reddit_users_normalized_username_key").on(table.normalizedUsername),]);

export const shortSqueezeAnalysisEvidence = pgTable.withRLS("short_squeeze_analysis_evidence", {
	id: uuid().defaultRandom().primaryKey(),
	analysisRunId: uuid("analysis_run_id").notNull().references(() => shortSqueezeAnalysisRuns.id, { onDelete: "cascade" } ),
	evidenceType: shortSqueezeEvidenceType("evidence_type").notNull(),
	factType: varchar("fact_type", { length: 120 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	summary: text().notNull(),
	details: jsonb(),
	sourceUrl: text("source_url").notNull(),
	sourceExternalId: varchar("source_external_id", { length: 255 }),
	sourceForm: varchar("source_form", { length: 40 }),
	sourceSection: varchar("source_section", { length: 160 }),
	effectiveAt: timestamp("effective_at", { withTimezone: true }),
	publishedAt: timestamp("published_at", { withTimezone: true }),
	evidenceSnippet: varchar("evidence_snippet", { length: 800 }).notNull(),
	confidence: integer().notNull(),
	contradiction: boolean().default(false).notNull(),
	contradictsEvidenceIds: jsonb("contradicts_evidence_ids").default([]).notNull(),
	extractionMethod: varchar("extraction_method", { length: 80 }).notNull(),
	modelVersion: varchar("model_version", { length: 120 }),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("short_squeeze_evidence_run_type_idx").using("btree", table.analysisRunId.asc().nullsLast(), table.evidenceType.asc().nullsLast()),
	index("short_squeeze_evidence_source_external_id_idx").using("btree", table.sourceExternalId.asc().nullsLast()),
	unique("short_squeeze_evidence_run_source_fact_key").on(table.analysisRunId, table.sourceExternalId, table.factType),check("short_squeeze_evidence_confidence_check", sql`((confidence >= 0) AND (confidence <= 100))`),]);

export const shortSqueezeAnalysisFacts = pgTable.withRLS("short_squeeze_analysis_facts", {
	id: uuid().defaultRandom().primaryKey(),
	analysisRunId: uuid("analysis_run_id").notNull().references(() => shortSqueezeAnalysisRuns.id, { onDelete: "cascade" } ),
	factKey: varchar("fact_key", { length: 120 }).notNull(),
	domain: shortSqueezeFactDomain().notNull(),
	provider: varchar({ length: 80 }).notNull(),
	sourceType: varchar("source_type", { length: 80 }).notNull(),
	sourceUrl: text("source_url"),
	sourceExternalId: varchar("source_external_id", { length: 255 }),
	valueType: varchar("value_type", { length: 40 }).notNull(),
	value: jsonb().notNull(),
	unit: varchar({ length: 40 }),
	effectiveAt: timestamp("effective_at", { withTimezone: true }),
	publishedAt: timestamp("published_at", { withTimezone: true }),
	observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
	quality: shortSqueezeFactQuality().notNull(),
	conflict: boolean().default(false).notNull(),
	adjustmentState: varchar("adjustment_state", { length: 40 }),
	rawHash: varchar("raw_hash", { length: 64 }),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("short_squeeze_facts_provider_effective_idx").using("btree", table.provider.asc().nullsLast(), table.effectiveAt.asc().nullsLast()),
	index("short_squeeze_facts_run_key_idx").using("btree", table.analysisRunId.asc().nullsLast(), table.factKey.asc().nullsLast()),
	unique("short_squeeze_facts_run_key_provider_effective_key").on(table.analysisRunId, table.factKey, table.provider, table.effectiveAt),]);

export const shortSqueezeAnalysisRuns = pgTable.withRLS("short_squeeze_analysis_runs", {
	id: uuid().defaultRandom().primaryKey(),
	requestedByUserId: text("requested_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	requestedTicker: varchar("requested_ticker", { length: 20 }).notNull(),
	normalizedTicker: varchar("normalized_ticker", { length: 20 }).notNull(),
	issuerName: varchar("issuer_name", { length: 255 }),
	cik: varchar({ length: 10 }),
	exchange: varchar({ length: 40 }),
	instrumentType: varchar("instrument_type", { length: 40 }),
	status: shortSqueezeAnalysisStatus().default("queued").notNull(),
	workflowRunId: varchar("workflow_run_id", { length: 255 }),
	idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
	schemaVersion: varchar("schema_version", { length: 40 }).notNull(),
	methodVersion: varchar("method_version", { length: 80 }).notNull(),
	analysisAsOf: timestamp("analysis_as_of", { withTimezone: true }).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true }),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	potentialScore: integer("potential_score"),
	potentialCategory: varchar("potential_category", { length: 40 }),
	confidenceScore: integer("confidence_score"),
	fundamentalQualityScore: integer("fundamental_quality_score"),
	supplyRiskScore: integer("supply_risk_score"),
	result: jsonb(),
	errorCode: varchar("error_code", { length: 100 }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	progressStage: shortSqueezeProgressStage("progress_stage").default("queued").notNull(),
}, (table) => [
	index("short_squeeze_runs_owner_created_idx").using("btree", table.requestedByUserId.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	index("short_squeeze_runs_status_created_idx").using("btree", table.status.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	index("short_squeeze_runs_ticker_created_idx").using("btree", table.normalizedTicker.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	unique("short_squeeze_runs_user_idempotency_key").on(table.requestedByUserId, table.idempotencyKey),check("short_squeeze_runs_confidence_score_check", sql`((confidence_score IS NULL) OR ((confidence_score >= 0) AND (confidence_score <= 100)))`),check("short_squeeze_runs_fundamental_quality_score_check", sql`((fundamental_quality_score IS NULL) OR ((fundamental_quality_score >= 0) AND (fundamental_quality_score <= 100)))`),check("short_squeeze_runs_potential_score_check", sql`((potential_score IS NULL) OR ((potential_score >= 0) AND (potential_score <= 100)))`),check("short_squeeze_runs_supply_risk_score_check", sql`((supply_risk_score IS NULL) OR ((supply_risk_score >= 0) AND (supply_risk_score <= 100)))`),]);

export const tradingWatchlistItems = pgTable.withRLS("trading_watchlist_items", {
	id: text().primaryKey(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	ticker: varchar({ length: 32 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("trading_watchlist_items_user_created_idx").using("btree", table.userId.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	unique("trading_watchlist_items_user_ticker_key").on(table.userId, table.ticker),]);

export const users = pgTable("users", {
	id: text().primaryKey(),
	username: varchar({ length: 100 }).notNull(),
	password: varchar({ length: 100 }).default("").notNull(),
	email: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 100 }).default(""),
	emailVerified: timestamp(),
	roles: varchar({ length: 100 }).array(),
	image: varchar({ length: 255 }).default("").notNull(),
	theme: varchar().default("light").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),]);
