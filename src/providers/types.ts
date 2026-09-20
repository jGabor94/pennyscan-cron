export interface T212Instrument {
    addedOn: string;
    currencyCode: string;
    extendedHours: boolean;
    isin: string;
    maxOpenQuantity: number;
    name: string;
    shortName: string;
    ticker: string;
    type: string;
    workingScheduleId: number;
}

export interface IBKRborrowingData {
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

export interface IBKRborrowingFile {
    source: string;
    asOfDate: string;
    asOfTime: string;
    count: number;
    securities: IBKRborrowingData[];
}
