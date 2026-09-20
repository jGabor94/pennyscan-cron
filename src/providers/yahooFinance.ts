import { readFile } from "node:fs/promises";
import YahooFinance from "yahoo-finance2";
import type { Quote } from "yahoo-finance2/modules/quote";
import { quoteBatchSize, requestTimeouts } from "../config.js";

const yahooFetch: typeof fetch = (input, init) => {
    const timeoutSignal = AbortSignal.timeout(requestTimeouts.yahooFinance);

    return fetch(input, {
        ...init,
        signal: init?.signal
            ? AbortSignal.any([init.signal, timeoutSignal])
            : timeoutSignal,
    });
};

const yahooFinance = new YahooFinance({
    fetch: yahooFetch,
    queue: { concurrency: 1, interval: 250 },
    suppressNotices: ["yahooSurvey"],
});

export const getLargeAndMegaMarketCapTickers = async (
    tickers: string[],
    minimumMarketCap = 10_000_000_000,
) => {
    const largeAndMegaMarketCapTickers: string[] = [];

    for (let index = 0; index < tickers.length; index += quoteBatchSize) {
        const batch = tickers.slice(index, index + quoteBatchSize);

        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const quotes = await yahooFinance.quote(batch, {
                    fields: ["symbol", "marketCap"],
                });

                for (const quote of quotes) {
                    if (
                        typeof quote.symbol === "string" &&
                        typeof quote.marketCap === "number" &&
                        quote.marketCap >= minimumMarketCap
                    ) {
                        largeAndMegaMarketCapTickers.push(quote.symbol);
                    }
                }

                break;
            } catch (error) {
                if (attempt === 1) {
                    console.warn("Yahoo market cap batch sikertelen, újrapróbálkozás...", error);
                } else {
                    console.error("Yahoo market cap batch két próbálkozás után kimarad:", error);
                }
            }
        }
    }

    return [...new Set(largeAndMegaMarketCapTickers)].sort();
};

export const readLargeAndMegaMarketCapTickers = async () => {
    const excludedTickersFile = new URL(
        "../../data/large-and-mega-market-cap-tickers.json",
        import.meta.url,
    );

    return new Set(
        JSON.parse(await readFile(excludedTickersFile, "utf8")) as string[],
    );
}

export const getQuotes = async (T212tickers: string[]): Promise<Quote[]> => {
    const quotes: Quote[] = [];

    for (let index = 0; index < T212tickers.length; index += quoteBatchSize) {
        const batch = T212tickers.slice(index, index + quoteBatchSize);

        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const batchQuotes = await yahooFinance.quote(batch);
                quotes.push(...batchQuotes);
                break;
            } catch (error) {
                if (attempt === 1) {
                    console.warn("Yahoo quote batch sikertelen, újrapróbálkozás...", error);
                } else {
                    console.error("Yahoo quote batch két próbálkozás után kimarad:", error);
                }
            }
        }
    }

    return quotes;
}

export interface ShortSqueezeYahooDetails {
    averageDailyVolume30Day: number;
    floatShares: number;
    shortPercentOfFloat: number;
    shortRatio: number;
}

const DAY_MS = 24 * 60 * 60 * 1_000;
const THIRTY_TRADING_DAYS = 30;

export const getShortSqueezeYahooDetails = async (
    symbol: string,
): Promise<ShortSqueezeYahooDetails | null> => {
    try {
        const now = new Date();
        const period1 = new Date(now.getTime() - 70 * DAY_MS);
        const [summary, chart] = await Promise.all([
            yahooFinance.quoteSummary(symbol, {
                modules: ["defaultKeyStatistics"],
            }),
            yahooFinance.chart(symbol, {
                period1,
                period2: now,
                interval: "1d",
                return: "array",
            }),
        ]);

        const statistics = summary.defaultKeyStatistics;
        const currentRegularSession = chart.meta.currentTradingPeriod.regular;
        const marketIsNotClosed = now < currentRegularSession.end;
        const completedVolumes = chart.quotes
            .filter(
                ({ date, volume }) =>
                    typeof volume === "number" &&
                    Number.isFinite(volume) &&
                    volume >= 0 &&
                    (!marketIsNotClosed || date < currentRegularSession.start),
            )
            .slice(-THIRTY_TRADING_DAYS)
            .map(({ volume }) => volume as number);

        if (
            completedVolumes.length !== THIRTY_TRADING_DAYS ||
            typeof statistics?.floatShares !== "number" ||
            typeof statistics.shortPercentOfFloat !== "number" ||
            typeof statistics.shortRatio !== "number"
        ) {
            return null;
        }

        return {
            averageDailyVolume30Day:
                completedVolumes.reduce((sum, volume) => sum + volume, 0) /
                THIRTY_TRADING_DAYS,
            floatShares: statistics.floatShares,
            shortPercentOfFloat: statistics.shortPercentOfFloat,
            shortRatio: statistics.shortRatio,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Yahoo kiegészítő adatok sikertelenek (${symbol}): ${message}`);
        return null;
    }
};
