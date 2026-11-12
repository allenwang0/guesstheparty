import { dailyIds, utcDateKey } from "../../lib/daily";
import { MEMBERS } from "../../lib/members";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function handler(req, res) {
  const date = req.query?.date ?? utcDateKey();
  if (!DATE_PATTERN.test(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  return res.status(200).json({
    date,
    ids: dailyIds(
      date,
      MEMBERS.map((m) => m.id),
    ),
  });
}
