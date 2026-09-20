-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "status" AS ENUM('evaluated', 'pending', 'unavailable');--> statement-breakpoint
CREATE TYPE "reddit_daily_lounge_analysis_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "reddit_tip_evaluation_method_version" AS ENUM('reddit-tip-evaluation-v2', 'reddit-tip-evaluation-v3');--> statement-breakpoint
CREATE TYPE "reddit_tip_price_strategy_outcome" AS ENUM('take-profit', 'stop-loss', 'ambiguous', 'neither');--> statement-breakpoint
CREATE TYPE "reddit_tip_temporal_intent" AS ENUM('same-day', 'next-day', 'next-trading-day', 'specific-date', 'multi-day', 'unspecified');--> statement-breakpoint
CREATE TYPE "short_squeeze_analysis_status" AS ENUM('queued', 'running', 'completed', 'partial', 'insufficient_data', 'failed');--> statement-breakpoint
CREATE TYPE "short_squeeze_evidence_type" AS ENUM('filing', 'issuer_release', 'regulatory', 'news', 'deterministic');--> statement-breakpoint
CREATE TYPE "short_squeeze_fact_domain" AS ENUM('instrument', 'market', 'short_positioning', 'borrow', 'settlement', 'options', 'fundamentals', 'dilution', 'catalyst');--> statement-breakpoint
CREATE TYPE "short_squeeze_fact_quality" AS ENUM('verified', 'estimated', 'stale', 'conflicted', 'missing');--> statement-breakpoint
CREATE TYPE "short_squeeze_progress_stage" AS ENUM('queued', 'collecting_market_data', 'collecting_regulatory_data', 'extracting_sec_evidence', 'calculating_scores', 'saving_report', 'completed');--> statement-breakpoint
CREATE TYPE "investment_research_progress_stage" AS ENUM('queued', 'identifying_instrument', 'collecting_market_data', 'collecting_regulatory_data', 'normalizing_data', 'extracting_evidence', 'calculating_metrics', 'assembling_fact_snapshot', 'analyzing_bull', 'analyzing_bear', 'validating_arguments', 'judging', 'validating_report', 'saving_report', 'completed');--> statement-breakpoint
CREATE TYPE "investment_research_status" AS ENUM('queued', 'running', 'completed', 'partial', 'insufficient_data', 'failed');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text,
	"providerAccountId" text,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_pkey" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "investment_research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requested_by_user_id" text NOT NULL,
	"requested_ticker" varchar(20) NOT NULL,
	"normalized_ticker" varchar(20) NOT NULL,
	"issuer_name" varchar(255),
	"cik" varchar(10),
	"exchange" varchar(40),
	"workflow_run_id" varchar(255),
	"status" "investment_research_status" DEFAULT 'queued'::"investment_research_status" NOT NULL,
	"progress_stage" "investment_research_progress_stage" DEFAULT 'queued'::"investment_research_progress_stage" NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"schema_version" varchar(40) NOT NULL,
	"method_version" varchar(80) NOT NULL,
	"analysis_as_of" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"facts_snapshot" jsonb,
	"bull_analysis" jsonb,
	"bear_analysis" jsonb,
	"judge_analysis" jsonb,
	"result" jsonb,
	"error_code" varchar(100),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investment_research_runs_user_idempotency_key" UNIQUE("requested_by_user_id","idempotency_key"),
	CONSTRAINT "investment_research_runs_error_message_length_check" CHECK (((error_message IS NULL) OR (char_length(error_message) <= 500)))
);
--> statement-breakpoint
ALTER TABLE "investment_research_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ticker" varchar(6) NOT NULL CONSTRAINT "notifications_ticker_key" UNIQUE,
	"change_percent" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reddit_daily_lounges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lounge_date" varchar(10) NOT NULL CONSTRAINT "reddit_daily_lounges_lounge_date_key" UNIQUE,
	"external_reddit_post_id" varchar(20) NOT NULL CONSTRAINT "reddit_daily_lounges_external_post_id_key" UNIQUE,
	"analysis_status" "reddit_daily_lounge_analysis_status" DEFAULT 'pending'::"reddit_daily_lounge_analysis_status" NOT NULL,
	"analysis_started_at" timestamp with time zone,
	"analysis_completed_at" timestamp with time zone,
	"analysis_error_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reddit_daily_lounges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reddit_recognized_tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reddit_user_id" uuid NOT NULL,
	"external_reddit_comment_id" varchar(20) NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tip_recorded_at" timestamp with time zone,
	"temporal_intent" "reddit_tip_temporal_intent",
	"target_market_date" varchar(10),
	CONSTRAINT "reddit_recognized_tips_comment_ticker_key" UNIQUE("external_reddit_comment_id","ticker")
);
--> statement-breakpoint
ALTER TABLE "reddit_recognized_tips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reddit_tip_price_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recognized_tip_id" uuid NOT NULL CONSTRAINT "reddit_tip_price_evaluations_tip_key" UNIQUE,
	"content_hash" varchar(64) NOT NULL,
	"status" "status" DEFAULT 'pending'::"status" NOT NULL,
	"strategy_outcome" "reddit_tip_price_strategy_outcome",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evaluation_method_version" "reddit_tip_evaluation_method_version",
	"entry_price" numeric(12,6),
	"highest_price" numeric(12,6),
	"lowest_price" numeric(12,6),
	"period_end_price" numeric(12,6),
	"period_end_price_at" timestamp with time zone,
	"start_price_at" timestamp with time zone,
	"target_market_date" varchar(10)
);
--> statement-breakpoint
ALTER TABLE "reddit_tip_price_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reddit_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(100) NOT NULL,
	"normalized_username" varchar(100) NOT NULL CONSTRAINT "reddit_users_normalized_username_key" UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reddit_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "short_squeeze_analysis_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"analysis_run_id" uuid NOT NULL,
	"evidence_type" "short_squeeze_evidence_type" NOT NULL,
	"fact_type" varchar(120) NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"details" jsonb,
	"source_url" text NOT NULL,
	"source_external_id" varchar(255),
	"source_form" varchar(40),
	"source_section" varchar(160),
	"effective_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"evidence_snippet" varchar(800) NOT NULL,
	"confidence" integer NOT NULL,
	"contradiction" boolean DEFAULT false NOT NULL,
	"contradicts_evidence_ids" jsonb DEFAULT '[]' NOT NULL,
	"extraction_method" varchar(80) NOT NULL,
	"model_version" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "short_squeeze_evidence_run_source_fact_key" UNIQUE("analysis_run_id","source_external_id","fact_type"),
	CONSTRAINT "short_squeeze_evidence_confidence_check" CHECK (((confidence >= 0) AND (confidence <= 100)))
);
--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_evidence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "short_squeeze_analysis_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"analysis_run_id" uuid NOT NULL,
	"fact_key" varchar(120) NOT NULL,
	"domain" "short_squeeze_fact_domain" NOT NULL,
	"provider" varchar(80) NOT NULL,
	"source_type" varchar(80) NOT NULL,
	"source_url" text,
	"source_external_id" varchar(255),
	"value_type" varchar(40) NOT NULL,
	"value" jsonb NOT NULL,
	"unit" varchar(40),
	"effective_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"observed_at" timestamp with time zone NOT NULL,
	"quality" "short_squeeze_fact_quality" NOT NULL,
	"conflict" boolean DEFAULT false NOT NULL,
	"adjustment_state" varchar(40),
	"raw_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "short_squeeze_facts_run_key_provider_effective_key" UNIQUE("analysis_run_id","fact_key","provider","effective_at")
);
--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_facts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "short_squeeze_analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requested_by_user_id" text NOT NULL,
	"requested_ticker" varchar(20) NOT NULL,
	"normalized_ticker" varchar(20) NOT NULL,
	"issuer_name" varchar(255),
	"cik" varchar(10),
	"exchange" varchar(40),
	"instrument_type" varchar(40),
	"status" "short_squeeze_analysis_status" DEFAULT 'queued'::"short_squeeze_analysis_status" NOT NULL,
	"workflow_run_id" varchar(255),
	"idempotency_key" varchar(128) NOT NULL,
	"schema_version" varchar(40) NOT NULL,
	"method_version" varchar(80) NOT NULL,
	"analysis_as_of" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"potential_score" integer,
	"potential_category" varchar(40),
	"confidence_score" integer,
	"fundamental_quality_score" integer,
	"supply_risk_score" integer,
	"result" jsonb,
	"error_code" varchar(100),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"progress_stage" "short_squeeze_progress_stage" DEFAULT 'queued'::"short_squeeze_progress_stage" NOT NULL,
	CONSTRAINT "short_squeeze_runs_user_idempotency_key" UNIQUE("requested_by_user_id","idempotency_key"),
	CONSTRAINT "short_squeeze_runs_confidence_score_check" CHECK (((confidence_score IS NULL) OR ((confidence_score >= 0) AND (confidence_score <= 100)))),
	CONSTRAINT "short_squeeze_runs_fundamental_quality_score_check" CHECK (((fundamental_quality_score IS NULL) OR ((fundamental_quality_score >= 0) AND (fundamental_quality_score <= 100)))),
	CONSTRAINT "short_squeeze_runs_potential_score_check" CHECK (((potential_score IS NULL) OR ((potential_score >= 0) AND (potential_score <= 100)))),
	CONSTRAINT "short_squeeze_runs_supply_risk_score_check" CHECK (((supply_risk_score IS NULL) OR ((supply_risk_score >= 0) AND (supply_risk_score <= 100))))
);
--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trading_watchlist_items" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"ticker" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trading_watchlist_items_user_ticker_key" UNIQUE("user_id","ticker")
);
--> statement-breakpoint
ALTER TABLE "trading_watchlist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"username" varchar(100) NOT NULL,
	"password" varchar(100) DEFAULT '' NOT NULL,
	"email" varchar(100) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"name" varchar(100) DEFAULT '',
	"emailVerified" timestamp,
	"roles" varchar(100)[],
	"image" varchar(255) DEFAULT '' NOT NULL,
	"theme" varchar DEFAULT 'light' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "investment_research_runs_owner_created_idx" ON "investment_research_runs" ("requested_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "investment_research_runs_status_created_idx" ON "investment_research_runs" ("status","created_at");--> statement-breakpoint
CREATE INDEX "investment_research_runs_ticker_created_idx" ON "investment_research_runs" ("normalized_ticker","created_at");--> statement-breakpoint
CREATE INDEX "reddit_recognized_tips_external_comment_id_idx" ON "reddit_recognized_tips" ("external_reddit_comment_id");--> statement-breakpoint
CREATE INDEX "reddit_recognized_tips_reddit_user_id_idx" ON "reddit_recognized_tips" ("reddit_user_id");--> statement-breakpoint
CREATE INDEX "reddit_tip_price_evaluations_status_idx" ON "reddit_tip_price_evaluations" ("status");--> statement-breakpoint
CREATE INDEX "short_squeeze_evidence_run_type_idx" ON "short_squeeze_analysis_evidence" ("analysis_run_id","evidence_type");--> statement-breakpoint
CREATE INDEX "short_squeeze_evidence_source_external_id_idx" ON "short_squeeze_analysis_evidence" ("source_external_id");--> statement-breakpoint
CREATE INDEX "short_squeeze_facts_provider_effective_idx" ON "short_squeeze_analysis_facts" ("provider","effective_at");--> statement-breakpoint
CREATE INDEX "short_squeeze_facts_run_key_idx" ON "short_squeeze_analysis_facts" ("analysis_run_id","fact_key");--> statement-breakpoint
CREATE INDEX "short_squeeze_runs_owner_created_idx" ON "short_squeeze_analysis_runs" ("requested_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "short_squeeze_runs_status_created_idx" ON "short_squeeze_analysis_runs" ("status","created_at");--> statement-breakpoint
CREATE INDEX "short_squeeze_runs_ticker_created_idx" ON "short_squeeze_analysis_runs" ("normalized_ticker","created_at");--> statement-breakpoint
CREATE INDEX "trading_watchlist_items_user_created_idx" ON "trading_watchlist_items" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reddit_recognized_tips" ADD CONSTRAINT "reddit_recognized_tips_reddit_user_id_reddit_users_id_fkey" FOREIGN KEY ("reddit_user_id") REFERENCES "reddit_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "reddit_tip_price_evaluations" ADD CONSTRAINT "reddit_tip_price_evaluations_SJstlt88N6CW_fkey" FOREIGN KEY ("recognized_tip_id") REFERENCES "reddit_recognized_tips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_evidence" ADD CONSTRAINT "short_squeeze_analysis_evidence_bFsy96jHlZx7_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "short_squeeze_analysis_runs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_facts" ADD CONSTRAINT "short_squeeze_analysis_facts_HnCww9PqfAsP_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "short_squeeze_analysis_runs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "short_squeeze_analysis_runs" ADD CONSTRAINT "short_squeeze_analysis_runs_requested_by_user_id_users_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "investment_research_runs" ADD CONSTRAINT "investment_research_runs_requested_by_user_id_users_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trading_watchlist_items" ADD CONSTRAINT "trading_watchlist_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
*/