import type { Quote } from "yahoo-finance2/modules/quote";

export interface DailyGainer {
  ticker: string;
  changePercent: number;
  price: number;
  volume: number;
  relativeVolume: number
}

export const getCurrentPrice = (quote: Quote): number | undefined => {
  switch (quote.marketState) {
    case "PRE":
    case "PREPRE":
      return (
        quote.preMarketPrice ??
        quote.extendedMarketPrice ??
        quote.regularMarketPrice
      );
    case "POST":
    case "POSTPOST":
      return (
        quote.postMarketPrice ??
        quote.extendedMarketPrice ??
        quote.regularMarketPrice
      );
    default:
      return quote.regularMarketPrice;
  }
};

export const getQuoteChangePercent = (quote: Quote): number | null => {
  const currentPrice = getCurrentPrice(quote);
  const previousClose = quote.regularMarketPreviousClose;

  if (
    typeof currentPrice !== "number" ||
    !Number.isFinite(currentPrice) ||
    typeof previousClose !== "number" ||
    !Number.isFinite(previousClose) ||
    previousClose <= 0
  ) {
    return null;
  }

  return ((currentPrice - previousClose) / previousClose) * 100;
};

export const formatDailyGainer = (quote: Quote): DailyGainer => {
  const changePercent = getQuoteChangePercent(quote);
  const price = getCurrentPrice(quote);

  if (
    typeof quote.symbol !== "string" ||
    changePercent === null ||
    typeof price !== "number"
  ) {
    throw new Error("Érvénytelen quote nem formázható daily gainerré.");
  }

  return {
    ticker: quote.symbol,
    changePercent,
    price,
    volume: quote.regularMarketVolume ?? 0,
    relativeVolume: quote.regularMarketVolume / quote.averageDailyVolume10Day
  };
};
