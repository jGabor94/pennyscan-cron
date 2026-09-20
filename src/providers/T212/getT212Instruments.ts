import { requestTimeouts } from "../../config.js";
import { T212Instrument } from "../types.js";

export async function getT212Instruments(): Promise<T212Instrument[]> {
    const apiKey = process.env.T212_API_KEY;
    const apiSecret = process.env.T212_API_SECRET;
    const environment = process.env.T212_ENV ?? "demo";

    if (!apiKey || !apiSecret) {
        throw new Error("A T212_API_KEY és T212_API_SECRET env változók megadása kötelező.");
    }

    if (environment !== "demo" && environment !== "live") {
        throw new Error("A T212_ENV értéke csak 'demo' vagy 'live' lehet.");
    }

    const baseUrl = `https://${environment}.trading212.com/api/v0`;
    const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const response = await fetch(`${baseUrl}/equity/metadata/instruments`, {
        signal: AbortSignal.timeout(requestTimeouts.T212Instruments),
        headers: {
            Accept: "application/json",
            Authorization: `Basic ${authorization}`,
        },
    });

    if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(
            `Trading 212 API hiba: ${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ""}`,
        );
    }

    const instruments: unknown = await response.json();

    if (!Array.isArray(instruments)) {
        throw new Error("A Trading 212 API nem instrumentumlistát adott vissza.");
    }

    return instruments as T212Instrument[];
}
