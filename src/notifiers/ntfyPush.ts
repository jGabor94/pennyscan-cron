import { requestTimeouts } from "../config.js";
import { DailyGainer } from "../utils/formatDailyGainer.js";

export const ntfyPush = async (gainer: DailyGainer, isShortSqueezePotential: boolean | undefined = false) => {

    if (!process.env.NTFY_TOPIC) {
        throw new Error("NTFY_TOPIC környezeti változó nincs beállítva.");
    }

    const response = await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
        method: "POST",
        signal: AbortSignal.timeout(requestTimeouts.ntfyPush),
        headers: {
            Title: `${gainer.ticker} +${gainer.changePercent.toFixed(1)}%-ot emelkedett a mai napon!`,
            Priority: "high",
            Tags: "chart_with_upwards_trend,fire",
            Click: `https://www.trading212.com/trading-instruments/invest/${gainer.ticker}.US`
        },
        body: `
        ${isShortSqueezePotential ? "Short Squeeze Potential!" : ""}
        Ár: $${gainer.price}
        RVOL: ${gainer.relativeVolume.toFixed(2)}x
        Volume: ${gainer.volume.toLocaleString()}
`,
    });

    if (!response.ok) {
        const responseBody = await response.text();

        throw new Error(
            `ntfy push sikertelen: ${response.status} ${response.statusText} - ${responseBody}`,
        );
    }
}
