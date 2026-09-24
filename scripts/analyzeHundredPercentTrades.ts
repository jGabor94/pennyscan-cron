import YahooFinance from "yahoo-finance2";
import type { ChartResultArrayQuote } from "yahoo-finance2/modules/chart";

// Futtatás: npx tsx scripts/analyzeHundredPercentTrades.ts
// Opcionális egyenlő tőke részvényenként: --capital=1000

const TICKERS = ["VRME", "GRML", "BTTC", "LOBO", "VEEE"] as const;
const GAIN_TRIGGER_PERCENT = 100;
const TAKE_PROFIT_PERCENT = 20;
const STOP_LOSS_PERCENT = 20;
const DEFAULT_CAPITAL_PER_TICKER = 1_000;
const CHART_LOOKBACK_HOURS = 30;
const REQUEST_TIMEOUT_MS = 30_000;

type ExitReason = "TAKE PROFIT" | "STOP LOSS" | "NYITOTT";

interface CompletedAnalysis {
  ticker: string;
  status: "TRADE";
  previousClose: number;
  triggerTime: Date;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  shares: number;
  exitReason: ExitReason;
  exitTime: Date;
  exitPrice: number;
  profitLoss: number;
  returnPercent: number;
  endValue: number;
  timeZone: string;
}

interface NoTradeAnalysis {
  ticker: string;
  status: "NO_TRIGGER" | "ERROR";
  message: string;
  endValue: number;
}

type Analysis = CompletedAnalysis | NoTradeAnalysis;

const yahooFetch: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

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

const getCapitalPerTicker = (): number => {
  const capitalArgument = process.argv.find((argument) =>
    argument.startsWith("--capital="),
  );
  const capital = capitalArgument
    ? Number(capitalArgument.slice("--capital=".length))
    : DEFAULT_CAPITAL_PER_TICKER;

  if (!Number.isFinite(capital) || capital <= 0) {
    throw new Error("A --capital értékének pozitív számnak kell lennie.");
  }

  return capital;
};

const getDateKey = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const isCompleteCandle = (
  candle: ChartResultArrayQuote,
): candle is ChartResultArrayQuote & {
  open: number;
  high: number;
  low: number;
  close: number;
} =>
  typeof candle.open === "number" &&
  Number.isFinite(candle.open) &&
  typeof candle.high === "number" &&
  Number.isFinite(candle.high) &&
  typeof candle.low === "number" &&
  Number.isFinite(candle.low) &&
  typeof candle.close === "number" &&
  Number.isFinite(candle.close);

const analyzeTicker = async (
  ticker: string,
  capital: number,
  now: Date,
): Promise<Analysis> => {
  try {
    const period1 = new Date(
      now.getTime() - CHART_LOOKBACK_HOURS * 60 * 60 * 1_000,
    );
    const [quote, chart] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.chart(ticker, {
        period1,
        period2: now,
        interval: "1m",
        includePrePost: true,
        return: "array",
      }),
    ]);
    const previousClose = quote.regularMarketPreviousClose;

    if (
      typeof previousClose !== "number" ||
      !Number.isFinite(previousClose) ||
      previousClose <= 0
    ) {
      throw new Error("Hiányzik a regularMarketPreviousClose érték.");
    }

    const timeZone = chart.meta.exchangeTimezoneName;
    const today = getDateKey(now, timeZone);
    const candles = chart.quotes
      .filter(isCompleteCandle)
      .filter((candle) => getDateKey(candle.date, timeZone) === today)
      .sort((left, right) => left.date.getTime() - right.date.getTime());
    const triggerPrice = previousClose * (1 + GAIN_TRIGGER_PERCENT / 100);
    const triggerIndex = candles.findIndex(
      (candle) => candle.high >= triggerPrice,
    );

    if (triggerIndex === -1) {
      return {
        ticker,
        status: "NO_TRIGGER",
        message: "Ma nem érte el az app képlete szerinti +100%-ot.",
        endValue: capital,
      };
    }

    const triggerCandle = candles[triggerIndex];

    if (!triggerCandle) {
      throw new Error("A +100%-os jelzőgyertya nem olvasható.");
    }

    // Ha a perces gyertya a küszöb fölött nyitott, a küszöbáron nem lehetett
    // volna biztosan teljesülni, ezért a gyertya nyitóárával számolunk.
    const entryPrice = Math.max(triggerPrice, triggerCandle.open);
    const takeProfitPrice = entryPrice * (1 + TAKE_PROFIT_PERCENT / 100);
    const stopLossPrice = entryPrice * (1 - STOP_LOSS_PERCENT / 100);
    const shares = capital / entryPrice;

    let exitReason: ExitReason = "NYITOTT";
    let exitTime = candles.at(-1)?.date ?? triggerCandle.date;
    let exitPrice = candles.at(-1)?.close ?? entryPrice;

    // A jelzőgyertyán belüli eseménysorrend nem ismert az 1 perces OHLC-ból,
    // ezért a TP/SL vizsgálata a következő teljes gyertyától indul.
    for (const candle of candles.slice(triggerIndex + 1)) {
      const hitTakeProfit = candle.high >= takeProfitPrice;
      const hitStopLoss = candle.low <= stopLossPrice;

      if (hitStopLoss) {
        // Ha ugyanabban a percben mindkettő érintett, konzervatívan a stop nyer.
        exitReason = "STOP LOSS";
        exitTime = candle.date;
        exitPrice = stopLossPrice;
        break;
      }

      if (hitTakeProfit) {
        exitReason = "TAKE PROFIT";
        exitTime = candle.date;
        exitPrice = takeProfitPrice;
        break;
      }
    }

    const endValue = shares * exitPrice;
    const profitLoss = endValue - capital;

    return {
      ticker,
      status: "TRADE",
      previousClose,
      triggerTime: triggerCandle.date,
      entryPrice,
      takeProfitPrice,
      stopLossPrice,
      shares,
      exitReason,
      exitTime,
      exitPrice,
      profitLoss,
      returnPercent: (profitLoss / capital) * 100,
      endValue,
      timeZone,
    };
  } catch (error) {
    return {
      ticker,
      status: "ERROR",
      message: error instanceof Error ? error.message : String(error),
      endValue: capital,
    };
  }
};

const formatMoney = (value: number): string =>
  value.toLocaleString("hu-HU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPrice = (value: number): string =>
  value.toLocaleString("hu-HU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

const formatTime = (date: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("hu-HU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);

const main = async (): Promise<void> => {
  const capitalPerTicker = getCapitalPerTicker();
  const now = new Date();
  const results = await Promise.all(
    TICKERS.map((ticker) => analyzeTicker(ticker, capitalPerTicker, now)),
  );

  console.log("\n+100%-os belépések 1 perces Yahoo chart adatok alapján");
  console.log(
    `Modell: ${formatMoney(capitalPerTicker)} USD/ticker, TP +${TAKE_PROFIT_PERCENT}%, SL -${STOP_LOSS_PERCENT}%`,
  );
  console.log(
    "A +100% alapja pontosan az app regularMarketPreviousClose mezője; a TP/SL a jelzőgyertya utáni perctől él.\n",
  );

  console.table(
    results.map((result) => {
      if (result.status !== "TRADE") {
        return {
          Ticker: result.ticker,
          Állapot: result.status === "NO_TRIGGER" ? "NINCS BELÉPÉS" : "HIBA",
          Megjegyzés: result.message,
        };
      }

      return {
        Ticker: result.ticker,
        "Előző záró": formatPrice(result.previousClose),
        "+100% idő": formatTime(result.triggerTime, result.timeZone),
        Belépő: formatPrice(result.entryPrice),
        Darab: result.shares.toFixed(4),
        Kilépés: result.exitReason,
        "Kilépés ideje": formatTime(result.exitTime, result.timeZone),
        "Kilépő ár": formatPrice(result.exitPrice),
        "Eredmény USD": formatMoney(result.profitLoss),
        "Hozam %": result.returnPercent.toFixed(2),
      };
    }),
  );

  const startingCapital = capitalPerTicker * TICKERS.length;
  const endingCapital = results.reduce(
    (sum, result) => sum + result.endValue,
    0,
  );
  const totalProfitLoss = endingCapital - startingCapital;

  console.log(`Kezdőtőke: ${formatMoney(startingCapital)} USD`);
  console.log(`Végérték:   ${formatMoney(endingCapital)} USD`);
  console.log(
    `Eredmény:   ${formatMoney(totalProfitLoss)} USD (${((totalProfitLoss / startingCapital) * 100).toFixed(2)}%)`,
  );
  console.log(
    "Megjegyzés: tört részvényekkel, díjak és csúszás nélkül számol; az 1 perces OHLC nem tickpontosságú.",
  );
};

await main();
