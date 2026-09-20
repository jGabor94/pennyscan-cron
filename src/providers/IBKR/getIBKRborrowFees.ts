import { Client } from "basic-ftp";
import { resolve } from "node:path";
import { Writable } from "node:stream";
import { pathToFileURL } from "node:url";
import { requestTimeouts } from "../../config.js";
import { writeJsonAtomically } from "../../utils/writeJsonAtomically.js";

const IBKR_FTP_HOST = "ftp2.interactivebrokers.com";
const IBKR_FTP_USER = "shortstock";
const IBKR_USA_FILE = "usa.txt";
const EXPECTED_HEADER =
  "#SYM|CUR|NAME|CON|ISIN|REBATERATE|FEERATE|AVAILABLE|FIGI|";

export interface IbkrBorrowFeeRecord {
  symbol: string;
  currency: string;
  name: string;
  contractId: string;
  isin: string;
  rebateRate: number | null;
  feeRate: number | null;
  availableShares: number;
  availableSharesAtLeast: boolean;
  figi: string;
}

export interface IbkrBorrowFeeData {
  source: string;
  asOfDate: string;
  asOfTime: string;
  count: number;
  securities: IbkrBorrowFeeRecord[];
}

function parseNumber(value: string, field: string, symbol: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Hibás ${field} érték a(z) ${symbol} rekordnál: ${value}`);
  }

  return parsed;
}

function parseNullableNumber(
  value: string,
  field: string,
  symbol: string,
): number | null {
  return value === "NA" ? null : parseNumber(value, field, symbol);
}

export function parseIbkrUsaTxt(file: Buffer): IbkrBorrowFeeData {
  const lines = file.toString("utf8").split(/\r?\n/).filter(Boolean);
  const bof = lines[0];
  const header = lines[1];
  const eof = lines.at(-1);

  if (bof === undefined || !bof.startsWith("#BOF|")) {
    throw new Error("Az IBKR usa.txt fájlból hiányzik a BOF fejléc.");
  }

  if (header !== EXPECTED_HEADER) {
    throw new Error("Az IBKR usa.txt oszlopai nem a várt formátumúak.");
  }

  if (eof === undefined || !eof.startsWith("#EOF|")) {
    throw new Error("Az IBKR usa.txt fájlból hiányzik az EOF sor.");
  }

  const [, rawDate, asOfTime] = bof.split("|");
  const expectedCount = Number(eof.split("|")[1]);

  if (rawDate === undefined || asOfTime === undefined) {
    throw new Error("Az IBKR usa.txt BOF dátuma vagy időpontja hibás.");
  }

  const securities = lines.slice(2, -1).map((line) => {
    const fields = line.split("|");

    if (fields.length !== 10 || fields[9] !== "") {
      throw new Error(`Hibás IBKR rekord: ${line}`);
    }

    const [
      symbol,
      currency,
      name,
      contractId,
      isin,
      rebateRate,
      feeRate,
      rawAvailableShares,
      figi,
    ] = fields;

    if (
      symbol === undefined ||
      currency === undefined ||
      name === undefined ||
      contractId === undefined ||
      isin === undefined ||
      rebateRate === undefined ||
      feeRate === undefined ||
      rawAvailableShares === undefined ||
      figi === undefined
    ) {
      throw new Error(`Hiányos IBKR rekord: ${line}`);
    }

    const availableSharesAtLeast = rawAvailableShares.startsWith(">");
    const availableShares = parseNumber(
      rawAvailableShares.replace(/^>/, ""),
      "AVAILABLE",
      symbol,
    );

    return {
      symbol,
      currency,
      name,
      contractId,
      isin,
      rebateRate: parseNullableNumber(rebateRate, "REBATERATE", symbol),
      feeRate: parseNullableNumber(feeRate, "FEERATE", symbol),
      availableShares,
      availableSharesAtLeast,
      figi,
    };
  });

  if (!Number.isInteger(expectedCount) || expectedCount !== securities.length) {
    throw new Error(
      `Az IBKR rekordszám eltér: EOF=${expectedCount}, feldolgozva=${securities.length}.`,
    );
  }

  return {
    source: `ftp://${IBKR_FTP_HOST}/${IBKR_USA_FILE}`,
    asOfDate: rawDate.replaceAll(".", "-"),
    asOfTime,
    count: securities.length,
    securities,
  };
}

/** Letölti és strukturált adattá alakítja az IBKR USA borrow fee állományát. */
export async function getIBKRborrowFees(): Promise<IbkrBorrowFeeData> {
  const client = new Client(requestTimeouts.IBKRBorrowFees);
  const chunks: Buffer[] = [];
  const destination = new Writable({
    write(chunk: Buffer | string, encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      callback();
    },
  });

  try {
    await client.access({
      host: IBKR_FTP_HOST,
      user: IBKR_FTP_USER,
      password: "",
      secure: false,
    });
    await client.downloadTo(destination, IBKR_USA_FILE);

    return parseIbkrUsaTxt(Buffer.concat(chunks));
  } finally {
    client.close();
  }
}

const scriptPath = process.argv[1];
const isDirectRun =
  scriptPath !== undefined && import.meta.url === pathToFileURL(resolve(scriptPath)).href;

if (isDirectRun) {
  try {
    const data = await getIBKRborrowFees();
    const outputFlagIndex = process.argv.indexOf("--output");

    if (outputFlagIndex === -1) {
      process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    } else {
      const outputPath = process.argv[outputFlagIndex + 1];

      if (outputPath === undefined) {
        throw new Error("A --output kapcsoló után meg kell adni a célfájlt.");
      }

      const resolvedOutputPath = resolve(outputPath);
      await writeJsonAtomically(resolvedOutputPath, data);
      console.log(
        `IBKR borrow fee JSON frissítve: ${resolvedOutputPath} (${data.count} rekord)`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Nem sikerült lekérni az IBKR borrow fee adatokat: ${message}`);
    process.exitCode = 1;
  }
}
