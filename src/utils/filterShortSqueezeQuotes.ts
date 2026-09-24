import type { Quote } from "yahoo-finance2/modules/quote";
import { shortSqueezeQuoteFilters } from "../config.js";
import { readIBKRborrowingData } from "../providers/IBKR/readIBKRborrowingData.js";
import {
  getShortSqueezeYahooDetails,
  type ShortSqueezeYahooDetails,
} from "../providers/yahooFinance.js";
import { getCurrentPrice, getQuoteChangePercent } from "./formatDailyGainer.js";
import { getEligibleIbkrSymbols } from "./getEligibleIbkrSymbols.js";
import { isFiniteNumber } from "./index.js";



type DetailsLoader = (
  symbol: string,
) => Promise<ShortSqueezeYahooDetails | null>;

type EligibleSymbolsLoader = () => Promise<ReadonlySet<string>>;

const loadEligibleIbkrSymbols = async (): Promise<ReadonlySet<string>> => {
  const borrowingData = await readIBKRborrowingData();
  return getEligibleIbkrSymbols(borrowingData);
};

export const filterShortSqueezeQuotes = async (
  quotes: Quote[],
  loadDetails: DetailsLoader = getShortSqueezeYahooDetails,
  loadEligibleSymbols: EligibleSymbolsLoader = loadEligibleIbkrSymbols,
): Promise<Quote[]> => {

  /*
  const borrowingData = await readIBKRborrowingData();

  await Promise.all((quotes.map(async (quote) => (async () => {



    const details = await loadDetails(quote.symbol);
    if (details === null) {
      return;
    }

    const state = {
      currentPrice: getCurrentPrice(quote),
      marketCap: quote.marketCap,
      averageVolume: quote.averageDailyVolume10Day,
      volume: quote.regularMarketVolume,
      relativeVolume: quote.regularMarketVolume / quote.averageDailyVolume10Day,
      borrowingData: borrowingData.find((data) => data.symbol === quote.symbol) ?? null,
      averageDailyVolume30Day: details?.averageDailyVolume30Day,
      floatShares: details?.floatShares,
      shortPercentOfFloat: details?.shortPercentOfFloat,
      shortRatio: details?.shortRatio,
    }

    const strongSetup = {
      currentPrice: 8.465,
      priceMomentum:
      {
        change5MinPercent: 2.4,
        change15MinPercent: 6.8,
        change30MinPercent: 11.2,
        change1HourPercent: 18.6,
        changeTodayPercent: 34.79,
        changeFromOpenPercent: 29.24,
        distanceFromDayHighPercent: -2.92,
        distanceFromDayLowPercent: 36.53, gapFromPreviousClosePercent: 4.30,
      }, dayLow: 6.20,
      dayHigh: 8.72,
      marketCap: 48_357_948,
      averageVolume: 379_099,
      volume: 7_200_000,
      relativeVolume: 18.99,
      borrowingData: {
        rebateRate: -172.4,
        annualizedBorrowFeePercent: 185.7,
        sharesAvailableToBorrow: 5_000,
      },
      averageDailyVolume30Day: 415_000,
      floatShares: 4_600_889,
      shortPercentOfFloat: 42.8,
      shortRatio: 7.6,
    }

    const midSetup = {
      currentPrice: 5.42,
      priceMomentum: {
        change5MinPercent: 0.6,
        change15MinPercent: 1.8,
        change30MinPercent: 3.4,
        change1HourPercent: 6.7,
        changeTodayPercent: 11.8,
        changeFromOpenPercent: 8.9,
        distanceFromDayHighPercent: -6.4,
        distanceFromDayLowPercent: 14.7,
        gapFromPreviousClosePercent: 2.7,
      },
      dayLow: 4.73,
      dayHigh: 5.79,
      marketCap: 72_000_000,
      averageVolume: 620_000,
      volume: 1_860_000,
      relativeVolume: 3.0,
      borrowingData: {
        rebateRate: -24.5,
        annualizedBorrowFeePercent: 31.8,
        sharesAvailableToBorrow: 95_000,
      },
      averageDailyVolume30Day: 680_000,
      floatShares: 8_200_000,
      shortPercentOfFloat: 21.5,
      shortRatio: 3.8,
    }

    const lowSetup = {
      currentPrice: 4.18,
      priceMomentum: {
        change5MinPercent: -0.3,
        change15MinPercent: 0.2,
        change30MinPercent: 0.7,
        change1HourPercent: 1.4,
        changeTodayPercent: 3.1,
        changeFromOpenPercent: 1.8,
        distanceFromDayHighPercent: -9.2,
        distanceFromDayLowPercent: 5.8,
        gapFromPreviousClosePercent: 1.1,
      },
      dayLow: 3.95,
      dayHigh: 4.60,
      marketCap: 142_000_000,
      averageVolume: 910_000,
      volume: 1_220_000,
      relativeVolume: 1.34,
      borrowingData: {
        rebateRate: -4.8,
        annualizedBorrowFeePercent: 8.2,
        sharesAvailableToBorrow: 780_000,
      },
      averageDailyVolume30Day: 940_000,
      floatShares: 23_500_000,
      shortPercentOfFloat: 8.7,
      shortRatio: 1.6,
    }

    const weakSetup = {
      currentPrice: 4.04,
      priceMomentum: {
        change5MinPercent: -0.4,
        change15MinPercent: -0.2,
        change30MinPercent: 0.1,
        change1HourPercent: 0.4,
        changeTodayPercent: 1.1,
        changeFromOpenPercent: 0.5,
        distanceFromDayHighPercent: -11.4,
        distanceFromDayLowPercent: 3.2,
        gapFromPreviousClosePercent: 0.6,
      },
      dayLow: 3.92,
      dayHigh: 4.56,
      marketCap: 190_000_000,
      averageVolume: 1_000_000,
      volume: 1_050_000,
      relativeVolume: 1.05,
      borrowingData: {
        rebateRate: -1.8,
        annualizedBorrowFeePercent: 3.5,

        sharesAvailableToBorrow: 2_800_000,
      },
      averageDailyVolume30Day: 1_020_000,
      floatShares: 31_000_000,
      shortPercentOfFloat: 5.5,
      shortRatio: 0.9,
    };

    console.log(state)
    const result = await evaluate({
      model: "typesafe-ai/jev",

      state: JSON.parse(JSON.stringify(midSetup)),

      questions: {
        squeezeStrength: {
          type: "score",

          instructions: `
Evaluate the strength of the current short-squeeze setup based only on
the supplied market data.

Consider the setup stronger when several of the following conditions
occur together:

Do not treat any single factor, including high volume, as sufficient
evidence of a strong short-squeeze setup.

Use the full combination of short pressure, borrow scarcity, float size,
trading activity, and current price momentum.
`,

          criteria: [
            "No meaningful short-squeeze setup",
            "Weak short-squeeze setup",
            "Moderate short-squeeze setup",
            "Strong short-squeeze setup",
            "Extreme short-squeeze setup"
          ]
        }
      },
    });

    console.log({ symbol: quote.symbol, ...result.answers.squeezeStrength });
  })())))

  return []
*/

  const eligibleIbkrSymbols = await loadEligibleIbkrSymbols()
  const quoteFiltered = quotes.filter((quote) => {
    const currentPrice = getCurrentPrice(quote);
    const marketCap = quote.marketCap;
    const averageVolume = quote.averageDailyVolume10Day;
    const volume = quote.regularMarketVolume;




    if (
      !isFiniteNumber(currentPrice) ||
      !isFiniteNumber(marketCap) ||
      !isFiniteNumber(averageVolume) ||
      !isFiniteNumber(volume) ||
      averageVolume <= 0
    ) {
      return false;
    }

    const relativeVolume = volume / averageVolume;


    return (
      marketCap < shortSqueezeQuoteFilters.maximumMarketCap &&
      relativeVolume > shortSqueezeQuoteFilters.minimumRelativeVolume &&
      currentPrice > shortSqueezeQuoteFilters.minimumPrice &&
      eligibleIbkrSymbols.has(quote.symbol)
    );
  });

  const filteredQuotes: Quote[] = [];




  for (const quote of quoteFiltered) {
    const details = await loadDetails(quote.symbol);

    if (details === null) {
      continue;
    }

    const shortPercentOfFloat = details.shortPercentOfFloat * 100;

    if (
      details.averageDailyVolume30Day > shortSqueezeQuoteFilters.minimumAverageDailyVolume30Day &&
      details.floatShares < shortSqueezeQuoteFilters.maximumFloatShares &&
      shortPercentOfFloat > shortSqueezeQuoteFilters.minimumShortPercentOfFloat &&
      details.shortRatio > shortSqueezeQuoteFilters.minimumShortRatio
    ) {
      filteredQuotes.push(quote);
    }
  }

  console.log(
    `Short squeeze quote szűrés: ${filteredQuotes.length} / ${quotes.length} ` +
    `(quote előszűrés után: ${quoteFiltered.length})`,
  );
  console.log("Részletek: ")
  console.log(filteredQuotes.map(quote =>
  ({
    symbol: quote.symbol,
    relativeVolume: Number((quote.regularMarketVolume / quote.averageDailyVolume10Day).toFixed(2)),
    chnagePercent: Number(getQuoteChangePercent(quote)?.toFixed(2))
  })
  ))

  return filteredQuotes;

};
