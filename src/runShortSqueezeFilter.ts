import type { Quote } from "yahoo-finance2/modules/quote";
import { readT212tickers } from "./providers/T212/readT212tickers.js";
import { getQuotes } from "./providers/yahooFinance.js";
import { filterShortSqueezeQuotes } from "./utils/filterShortSqueezeQuotes.js";

const getRelativeVolume = (quote: Quote): number => {
  const volume = quote.regularMarketVolume;
  const averageVolume = quote.averageDailyVolume10Day;

  if (
    typeof volume !== "number" ||
    typeof averageVolume !== "number" ||
    averageVolume <= 0
  ) {
    return 0;
  }

  return volume / averageVolume;
};

const T212tickers = await readT212tickers();
const quotes = await getQuotes(T212tickers);
const shortSqueezeQuotes = await filterShortSqueezeQuotes(quotes);
const sortedQuotes = shortSqueezeQuotes.toSorted(
  (left, right) => getRelativeVolume(right) - getRelativeVolume(left),
);

console.log(
  sortedQuotes.map((quote) => ({
    symbol: quote.symbol,
    relativeVolume: Number(getRelativeVolume(quote).toFixed(2)),
  })),
);
