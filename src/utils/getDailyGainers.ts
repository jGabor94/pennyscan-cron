import type { Quote } from "yahoo-finance2/modules/quote";
import { regularChangePercentThreshold } from "../config.js";
import { getQuoteChangePercent } from "./formatDailyGainer.js";

export const getDailyGainers = (quotes: Quote[]): Quote[] => {
  const gainers = quotes.filter((quote) => {
    const changePercent = getQuoteChangePercent(quote);

    return (
      typeof quote.symbol === "string" &&
      changePercent !== null &&
      changePercent >= regularChangePercentThreshold
    );
  });

  console.log(`Lekért részvények száma: ${quotes.length}`);
  console.log(
    `Legalább ${regularChangePercentThreshold}%-ot emelkedő részvények száma: ${gainers.length}`,
  );
  console.log("Részletek: ");
  console.log(gainers.map((quote) => ({
    symbol: quote.symbol,
    changePercent: Number(getQuoteChangePercent(quote)?.toFixed(2)),
  })));

  return gainers;
};
