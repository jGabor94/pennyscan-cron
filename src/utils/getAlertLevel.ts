export interface AlertLevels {
  alertLevel: number | null;
  nextAlertLevel: number;
}

export function getAlertLevel(changePercent: number): AlertLevels {
  if (!Number.isFinite(changePercent)) {
    return { alertLevel: null, nextAlertLevel: 20 };
  }

  if (changePercent < 20) {
    return { alertLevel: null, nextAlertLevel: 20 };
  }

  if (changePercent < 50) {
    return { alertLevel: 20, nextAlertLevel: 50 };
  }

  if (changePercent < 100) {
    return { alertLevel: 50, nextAlertLevel: 100 };
  }

  const alertLevel = Math.floor(changePercent / 100) * 100;

  return { alertLevel, nextAlertLevel: alertLevel + 100 };
}
