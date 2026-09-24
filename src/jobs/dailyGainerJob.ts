import { eq } from "drizzle-orm/sql/expressions/index";
import { db } from "../drizzle/db.js";
import { notifications } from "../drizzle/migrations/schema.js";
import { getTodayNtfy } from "../drizzle/queries/getTodayNtfy.js";
import { ntfyPush } from "../notifiers/ntfyPush.js";
import { readT212tickers } from "../providers/T212/readT212tickers.js";
import { getQuotes, readLargeAndMegaMarketCapTickers } from "../providers/yahooFinance.js";
import { filterShortSqueezeQuotes } from "../utils/filterShortSqueezeQuotes.js";
import { formatDailyGainer } from "../utils/formatDailyGainer.js";
import { getAlertLevel } from "../utils/getAlertLevel.js";
import { getDailyGainers } from "../utils/getDailyGainers.js";



export async function dailyGainerJob() {

  let T212tickers = await readT212tickers();

  const excludedTickers = await readLargeAndMegaMarketCapTickers()

  T212tickers = T212tickers.filter((ticker) => !excludedTickers.has(ticker));

  const quotes = await getQuotes(T212tickers);
  const dailyGainerQuotes = getDailyGainers(quotes);
  const shortSqueezeQuotes = await filterShortSqueezeQuotes(dailyGainerQuotes);



  const notificationsResult = await getTodayNtfy()
  const notifyPromises = dailyGainerQuotes.map((gainerQuote) => (async () => {

    const notification = notificationsResult.find((notification) => notification.ticker === gainerQuote.symbol);
    const isShortSqueezePotential = shortSqueezeQuotes.some((quote) => quote.symbol === gainerQuote.symbol);
    const gainer = formatDailyGainer(gainerQuote);


    if (notification) {
      const { nextAlertLevel } = getAlertLevel(notification.changePercent);
      if (gainer.changePercent >= nextAlertLevel) {
        await db.transaction(async (tx) => {
          await tx.update(notifications).set({
            changePercent: Math.round(gainer.changePercent),
          }).where(eq(notifications.id, notification.id));

          await ntfyPush(gainer, isShortSqueezePotential);
        })

      }

    } else {
      await db.transaction(async (tx) => {
        await tx.insert(notifications).values({
          ticker: gainer.ticker,
          changePercent: Math.round(gainer.changePercent),
        })
        await ntfyPush(gainer, isShortSqueezePotential);
      })

    }


  })())

  await Promise.all(notifyPromises);

}
