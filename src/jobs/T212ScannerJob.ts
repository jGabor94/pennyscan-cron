import { getT212Instruments } from "../providers/T212/getT212Instruments.js";
import { writeJsonAtomically } from "../utils/writeJsonAtomically.js";

const outputFile = new URL("../../data/t212-instruments.json", import.meta.url);

export async function T212ScannerJob() {
    const instruments = await getT212Instruments();

    await writeJsonAtomically(outputFile, instruments);

    console.log(
        `A Trading 212 instrumentumlista frissítve: ${instruments.length} darab.`,
    );
}
