export interface AlertLevels {
  alertLevel: number | null;
  nextAlertLevel: number;
}

export function getAlertLevel(changePercent: number): AlertLevels {
  if (!Number.isFinite(changePercent)) {
    return { alertLevel: null, nextAlertLevel: 40 };
  }

  if (changePercent < 40) {
    return { alertLevel: null, nextAlertLevel: 40 };
  }

  if (changePercent < 100) {
    return { alertLevel: 40, nextAlertLevel: 100 };
  }

  const alertLevel = Math.floor(changePercent / 100) * 100;

  return { alertLevel, nextAlertLevel: alertLevel + 100 };
}
