// ─── Date helper ───
// Uppdaterad: Tar nu emot ett datum som bas för måndagen
export function startOfWeekMonday(baseDate = new Date()) {
  const d = new Date(baseDate);
  const day = d.getDay() || 7; // Sun=0 → 7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format Date to YYYY-MM-DD */
export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hjälpfunktion för veckonummer
export function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
