import type { Quote } from "yahoo-finance2/modules/quote";
import { changePercentThreshold } from "../config.js";
import { getQuoteChangePercent } from "./formatDailyGainer.js";

export const getDailyGainers = (quotes: Quote[]): Quote[] => {
  const gainers = quotes.filter((quote) => {
    const changePercent = getQuoteChangePercent(quote);

    const relativeVolume = quote.regularMarketVolume / quote.averageDailyVolume10Day

    return (
      typeof quote.symbol === "string" &&
      changePercent !== null &&
      changePercent >= changePercentThreshold &&
      relativeVolume >= 1
    );
  });

  console.log(`Lekért részvények száma: ${quotes.length}`);
  console.log(
    `Legalább ${changePercentThreshold}%-ot emelkedő részvények száma: ${gainers.length}`,
  );
  console.log("Részletek: ");
  console.log(gainers.map((quote) => ({
    symbol: quote.symbol,
    changePercent: Number(getQuoteChangePercent(quote)?.toFixed(2)),
    relativeVolume: quote.regularMarketVolume / quote.averageDailyVolume10Day
  })));

  return gainers;
};
