import assert from "node:assert/strict";
import test from "node:test";
import type { Quote } from "yahoo-finance2/modules/quote";
import { filterShortSqueezeQuotes } from "../src/utils/filterShortSqueezeQuotes.js";
import type { ShortSqueezeYahooDetails } from "../src/providers/yahooFinance.js";

const quote = (overrides: Partial<Quote> = {}): Quote =>
  ({
    symbol: "PASS",
    marketState: "REGULAR",
    regularMarketPrice: 1,
    marketCap: 9_000_000_000,
    averageDailyVolume10Day: 500_000,
    regularMarketVolume: 600_000,
    ...overrides,
  }) as Quote;

const validDetails: ShortSqueezeYahooDetails = {
  averageDailyVolume30Day: 600_000,
  floatShares: 40_000_000,
  shortPercentOfFloat: 0.16,
  shortRatio: 2.1,
};

const loadDetails = async (): Promise<ShortSqueezeYahooDetails> => validDetails;
const loadEligibleSymbols = async (): Promise<ReadonlySet<string>> =>
  new Set(["PASS"]);

const filterQuotes = (
  quotes: Quote[],
  detailsLoader: (
    symbol: string,
  ) => Promise<ShortSqueezeYahooDetails | null> = loadDetails,
) => filterShortSqueezeQuotes(quotes, detailsLoader, loadEligibleSymbols);

test("megtartja a minden feltételen átmenő quote-ot", async () => {
  const result = await filterQuotes([quote()]);

  assert.deepEqual(result.map(({ symbol }) => symbol), ["PASS"]);
});

test("kiszűri a market cap, relatív volumen és ár hibákat", async () => {
  const quotes = [
    quote({ symbol: "MARKET_CAP", marketCap: 10_000_000_000 }),
    quote({ symbol: "REL_VOLUME", regularMarketVolume: 500_000 }),
    quote({ symbol: "PRICE", regularMarketPrice: 0.5 }),
  ];

  assert.deepEqual(await filterQuotes(quotes), []);
});

test("a 10 napos volumenátlagot használja a relatív volumenhez", async () => {
  const passingQuote = quote({
    averageDailyVolume10Day: 250_000,
    averageDailyVolume3Month: 400_000,
    regularMarketVolume: 300_000,
  });

  assert.deepEqual(
    await filterQuotes([passingQuote]),
    [passingQuote],
  );
});

test("kiszűri a hiányos adatú quote-ot", async () => {
  assert.deepEqual(
    await filterQuotes(
      [
        quote({ symbol: "NO_MARKET_CAP", marketCap: undefined }),
        quote({ symbol: "NO_VOLUME", regularMarketVolume: undefined }),
      ],
    ),
    [],
  );
});

test("pre-market állapotban a pre-market árat szűri", async () => {
  assert.deepEqual(
    await filterQuotes(
      [quote({ marketState: "PRE", preMarketPrice: 0.49 })],
    ),
    [],
  );
});

test("kiszűri a kiegészítő Yahoo-feltételek határértékeit", async () => {
  const failingDetails: ShortSqueezeYahooDetails[] = [
    { ...validDetails, averageDailyVolume30Day: 500_000 },
    { ...validDetails, floatShares: 50_000_000 },
    { ...validDetails, shortPercentOfFloat: 0.15 },
    { ...validDetails, shortRatio: 2 },
  ];

  for (const details of failingDetails) {
    assert.deepEqual(
      await filterQuotes([quote()], async () => details),
      [],
    );
  }
});

test("kiszűri a hiányzó kiegészítő Yahoo-adatokat", async () => {
  assert.deepEqual(
    await filterQuotes([quote()], async () => null),
    [],
  );
});
