export const quoteBatchSize = 100;
export const changePercentThreshold = 40;
export const regularChangePercentThreshold = 20;

export const shortSqueezeQuoteFilters = {
  maximumMarketCap: 10_000_000_000,
  minimumAverageDailyVolume30Day: 500_000,
  minimumRelativeVolume: 1,
  maximumFloatShares: 50_000_000,
  minimumPrice: 0.5,
  minimumShortPercentOfFloat: 15,
  minimumShortRatio: 2,
  minimumBorrowFeeIBKRPercent: 5,
} as const;

export const cronExpressions = {
  dailyGainerJob: "*/5 4-19 * * 1-5",
  T212ScannerJob: "0 0 * * 1-5",
  IBKRBorrowFeesJob: "*/15 * * * 1-5",
  saveLargeMarketCapTickersJob: "15 0 * * 1",
} as const;

export const requestTimeouts = {
  yahooFinance: 120_000,
  T212Instruments: 30_000,
  IBKRBorrowFees: 30_000,
  ntfyPush: 30_000,
} as const;
