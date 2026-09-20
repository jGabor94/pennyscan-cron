import { readFile } from "node:fs/promises";
import type { IBKRborrowingFile } from "../types.js";

const decodeJsonFile = (file: Buffer): string => {
    const isUtf16LittleEndian = file[0] === 0xff && file[1] === 0xfe;

    if (isUtf16LittleEndian) {
        return file.subarray(2).toString("utf16le");
    }

    return file.toString("utf8").replace(/^\uFEFF/, "");
};

export const readIBKRborrowingData = async () => {
    const inputFile = new URL("../../../data/ibkr-borrow-fees.json", import.meta.url);
    const file = await readFile(inputFile);

    const data = JSON.parse(decodeJsonFile(file)) as IBKRborrowingFile;

    return data.securities;

};
