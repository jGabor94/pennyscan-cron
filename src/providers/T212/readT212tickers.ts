import { readFile } from "node:fs/promises";
import { T212Instrument } from "../types.js";

export async function readT212tickers(): Promise<string[]> {
    const inputFile = new URL("../../../data/t212-instruments.json", import.meta.url);
    const instruments = JSON.parse(
        await readFile(inputFile, "utf8"),
    ) as T212Instrument[];

    const tickers = [
        ...new Set(
            instruments
                .filter(
                    (instrument) =>
                        instrument.type === "STOCK" &&
                        instrument.extendedHours === true &&
                        instrument.currencyCode === "USD" &&
                        (instrument.ticker.endsWith("_US_EQ") ||
                            instrument.ticker.endsWith("_EQ_US") ||
                            !instrument.ticker.includes("_")),
                )
                .map((instrument) => instrument.shortName.replace(/[./]/g, "-")),
        ),
    ];


    return tickers
}
