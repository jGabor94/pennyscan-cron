import { readT212tickers } from "../providers/T212/readT212tickers.js";
import { getLargeAndMegaMarketCapTickers } from "../providers/yahooFinance.js";
import { writeJsonAtomically } from "../utils/writeJsonAtomically.js";


const largeMarketCapTickersFile = new URL(
  "../../data/large-and-mega-market-cap-tickers.json",
  import.meta.url,
);

export async function saveLargeMarketCapTickersJob(): Promise<void> {

  const tickers = await readT212tickers()
  const largeAndMegaMarketCapTickers = await getLargeAndMegaMarketCapTickers(tickers);

  await writeJsonAtomically(
    largeMarketCapTickersFile,
    largeAndMegaMarketCapTickers,
  );

  console.log(
    `Large és mega cap tickerek elmentve: ${largeAndMegaMarketCapTickers.length} / ${tickers.length}`,
  );
}
