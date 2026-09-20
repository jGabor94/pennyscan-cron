import { db } from "../db.js";

export const getTodayNtfy = async () => {
  const tradingDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());

  return db.query.notifications.findMany({
    where: {
      tradingDate,
    },
  });
};
