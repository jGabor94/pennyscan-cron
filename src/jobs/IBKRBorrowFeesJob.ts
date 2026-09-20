import { getIBKRborrowFees } from "../providers/IBKR/getIBKRborrowFees.js";
import { writeJsonAtomically } from "../utils/writeJsonAtomically.js";

const outputFile = new URL("../../data/ibkr-borrow-fees.json", import.meta.url);

export async function IBKRBorrowFeesJob(): Promise<void> {
  const data = await getIBKRborrowFees();

  await writeJsonAtomically(outputFile, data);

  console.log(
    `Az IBKR borrow fee adatok frissítve: ${data.count} rekord (${data.asOfDate} ${data.asOfTime}).`,
  );
}
