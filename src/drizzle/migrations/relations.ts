import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
	account: {
		user: r.one.users({
			from: r.account.userId,
			to: r.users.id
		}),
	},
	users: {
		accounts: r.many.account(),
		investmentResearchRuns: r.many.investmentResearchRuns(),
		shortSqueezeAnalysisRuns: r.many.shortSqueezeAnalysisRuns(),
		tradingWatchlistItems: r.many.tradingWatchlistItems(),
	},
	investmentResearchRuns: {
		user: r.one.users({
			from: r.investmentResearchRuns.requestedByUserId,
			to: r.users.id
		}),
	},
	redditRecognizedTips: {
		redditUser: r.one.redditUsers({
			from: r.redditRecognizedTips.redditUserId,
			to: r.redditUsers.id
		}),
		redditTipPriceEvaluations: r.one.redditTipPriceEvaluations(),
	},
	redditUsers: {
		redditRecognizedTips: r.many.redditRecognizedTips(),
	},
	redditTipPriceEvaluations: {
		redditRecognizedTip: r.one.redditRecognizedTips({
			from: r.redditTipPriceEvaluations.recognizedTipId,
			to: r.redditRecognizedTips.id
		}),
	},
	shortSqueezeAnalysisEvidence: {
		shortSqueezeAnalysisRun: r.one.shortSqueezeAnalysisRuns({
			from: r.shortSqueezeAnalysisEvidence.analysisRunId,
			to: r.shortSqueezeAnalysisRuns.id
		}),
	},
	shortSqueezeAnalysisRuns: {
		shortSqueezeAnalysisEvidences: r.many.shortSqueezeAnalysisEvidence(),
		shortSqueezeAnalysisFacts: r.many.shortSqueezeAnalysisFacts(),
		user: r.one.users({
			from: r.shortSqueezeAnalysisRuns.requestedByUserId,
			to: r.users.id
		}),
	},
	shortSqueezeAnalysisFacts: {
		shortSqueezeAnalysisRun: r.one.shortSqueezeAnalysisRuns({
			from: r.shortSqueezeAnalysisFacts.analysisRunId,
			to: r.shortSqueezeAnalysisRuns.id
		}),
	},
	tradingWatchlistItems: {
		user: r.one.users({
			from: r.tradingWatchlistItems.userId,
			to: r.users.id
		}),
	},
}))