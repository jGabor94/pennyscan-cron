import assert from "node:assert/strict";
import test from "node:test";
import type { Quote } from "yahoo-finance2/modules/quote";
import { regularChangePercentThreshold } from "../src/config.js";
import { formatDailyGainer } from "../src/utils/formatDailyGainer.js";
import { getDailyGainers } from "../src/utils/getDailyGainers.js";

const quote = (overrides: Partial<Quote> = {}): Quote =>
  ({
    symbol: "GAIN",
    marketState: "REGULAR",
    regularMarketPrice: 1.5,
    regularMarketPreviousClose: 1,
    regularMarketVolume: 123_456,
    ...overrides,
  }) as Quote;

test("a getDailyGainers Quote objektumokat szűr, nem formáz", () => {
  const passingQuote = quote();
  const result = getDailyGainers([
    passingQuote,
    quote({
      symbol: "LOW_GAIN",
      regularMarketPrice: 1 + regularChangePercentThreshold / 100 - 0.01,
    }),
    quote({ symbol: "INVALID", regularMarketPreviousClose: undefined }),
  ]);

  assert.deepEqual(result, [passingQuote]);
  assert.equal(result[0]?.symbol, "GAIN");
  assert.equal("ticker" in (result[0] ?? {}), false);
});

test("a formatDailyGainer egyetlen quote-ból készít értesítési objektumot", () => {
  assert.deepEqual(formatDailyGainer(quote()), {
    ticker: "GAIN",
    changePercent: 50,
    price: 1.5,
    volume: 123_456,
  });
});

test("a formázó a piaci állapot szerinti aktuális árat használja", () => {
  assert.deepEqual(
    formatDailyGainer(
      quote({ marketState: "PRE", preMarketPrice: 2, regularMarketPrice: 1.5 }),
    ),
    {
      ticker: "GAIN",
      changePercent: 100,
      price: 2,
      volume: 123_456,
    },
  );
});
