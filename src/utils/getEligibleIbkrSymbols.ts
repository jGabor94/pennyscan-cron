import { shortSqueezeQuoteFilters } from "../config.js";
import type { IBKRborrowingData } from "../providers/types.js";
import { isFiniteNumber } from "./index.js";

export const getEligibleIbkrSymbols = async (borrowingData: IBKRborrowingData[]) => {

    const eligibleIbkrSymbols = new Set(
        borrowingData
            .filter(
                ({ feeRate }) =>
                    isFiniteNumber(feeRate) &&
                    feeRate > shortSqueezeQuoteFilters.minimumBorrowFeeIBKRPercent
            )
            .map(({ symbol }) => symbol),
    );

    return eligibleIbkrSymbols;
}
