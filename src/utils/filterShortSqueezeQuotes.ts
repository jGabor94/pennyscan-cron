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
  const eligibleIbkrSymbols = await loadEligibleSymbols();

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
