import "dotenv/config";
import cron from "node-cron";
import { appendFile, rename, rm, stat } from "node:fs/promises";
import { cronExpressions } from "./config.js";
import { closeDatabaseConnection } from "./drizzle/db.js";
import { dailyGainerJob } from "./jobs/dailyGainerJob.js";
import { IBKRBorrowFeesJob } from "./jobs/IBKRBorrowFeesJob.js";
import { saveLargeMarketCapTickersJob } from "./jobs/saveLargeMarketCapTickersJob.js";
import { T212ScannerJob } from "./jobs/T212ScannerJob.js";

const timezone = "Europe/Budapest";
const marketTimezone = "America/New_York";
const errorLogFile = new URL("../cron-errors.txt", import.meta.url);
const errorLogBackupFile = new URL("../cron-errors.1.txt", import.meta.url);
const errorLogMaxBytes = 1024 * 1024;
let errorLogWriteQueue = Promise.resolve();

async function rotateAndAppendErrorLog(entry: string): Promise<void> {
  let currentSize = 0;

  try {
    currentSize = (await stat(errorLogFile)).size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (currentSize + Buffer.byteLength(entry, "utf8") > errorLogMaxBytes) {
    await rm(errorLogBackupFile, { force: true });
    await rename(errorLogFile, errorLogBackupFile);
  }

  await appendFile(errorLogFile, entry, "utf8");
}

function appendErrorLog(entry: string): Promise<void> {
  const write = errorLogWriteQueue
    .catch(() => undefined)
    .then(() => rotateAndAppendErrorLog(entry));

  errorLogWriteQueue = write;
  return write;
}

async function runSafely(
  jobName: string,
  job: () => Promise<void>,
): Promise<boolean> {
  try {
    await job();
    return true;
  } catch (error) {
    console.error(`A(z) ${jobName} cron feladat hibával leállt:`, error);

    const errorDetails =
      error instanceof Error ? (error.stack ?? error.message) : String(error);

    try {
      await appendErrorLog(
        `[${new Date().toISOString()}] ${jobName}\n${errorDetails}\n\n`,
      );
    } catch (logError) {
      console.error("A cronhiba fájlba írása sikertelen:", logError);
    }

    return false;
  }
}

async function runOnce(
  jobName: string,
  job: () => Promise<void>,
  cleanup?: () => Promise<void>,
): Promise<void> {
  let succeeded = false;

  try {
    succeeded = await runSafely(jobName, job);
  } finally {
    await cleanup?.();
  }

  if (!succeeded) {
    process.exitCode = 1;
  }
}

if (process.argv.includes("--ibkr-once")) {
  await runOnce("ibkr-borrow-fees", IBKRBorrowFeesJob);
} else if (process.argv.includes("--large-market-cap-once")) {
  await runOnce("large-market-cap-export", saveLargeMarketCapTickersJob);
} else if (process.argv.includes("--t212-once")) {
  await runOnce("t212-scanner", T212ScannerJob);
} else if (process.argv.includes("--once")) {
  await runOnce("pennyscan", dailyGainerJob, closeDatabaseConnection);
} else {
  cron.schedule(
    cronExpressions.dailyGainerJob,
    () => runSafely("pennyscan", dailyGainerJob),
    {
      name: "pennyscan",
      timezone: marketTimezone,
      noOverlap: true,
    },
  );

  cron.schedule(
    cronExpressions.T212ScannerJob,
    () => runSafely("t212-scanner", T212ScannerJob),
    {
      name: "pennyscan-daily",
      timezone,
      noOverlap: true,
    },
  );

  cron.schedule(
    cronExpressions.IBKRBorrowFeesJob,
    () => runSafely("ibkr-borrow-fees", IBKRBorrowFeesJob),
    {
      name: "ibkr-borrow-fees",
      timezone,
      noOverlap: true,
    },
  );

  cron.schedule(
    cronExpressions.saveLargeMarketCapTickersJob,
    () => runSafely("large-market-cap-export", saveLargeMarketCapTickersJob),
    {
      name: "large-market-cap-export",
      timezone,
      noOverlap: true,
    },
  );

  console.log(
    `Pennyscan cron elindult: ${cronExpressions.dailyGainerJob} (${marketTimezone})`,
  );
  console.log(
    `Napi cron elindult: ${cronExpressions.T212ScannerJob} (${timezone})`,
  );
  console.log(
    `IBKR cron elindult: ${cronExpressions.IBKRBorrowFeesJob} (${timezone})`,
  );
  console.log(
    `Large market cap cron elindult: ${cronExpressions.saveLargeMarketCapTickersJob} (${timezone})`,
  );
}
