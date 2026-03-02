/**
 * @file tasks.js
 * @description Fabriksfunktion för att skapa uppgiftsobjekt.
 * Säkerställer att alla uppgifter har en konsekvent datastruktur
 * oavsett vilka fält som skickas in.
 */

/**
 * @typedef {Object} TaskTime
 * @property {string} start - Starttid i "HH:mm"-format
 * @property {string} [end]  - Sluttid i "HH:mm"-format (valfri)
 */

/**
 * Normaliserar taskTime till {start, end}-objekt.
 * Accepterar antingen en sträng ("08:30") eller ett objekt ({start, end}).
 * Tom sträng / null / undefined → null (= Hela dagen).
 * @param {string|TaskTime|null|undefined} raw
 * @returns {TaskTime|null}
 */
export function normalizeTaskTime(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return raw.trim() ? { start: raw.trim(), end: "" } : null;
  }
  if (typeof raw === "object" && raw.start) {
    return { start: raw.start, end: raw.end || "" };
  }
  return null;
}

/**
 * Formaterar taskTime till en läsbar sträng.
 * "08:30" eller "08:30–10:00" eller null → "Hela dagen"
 * @param {TaskTime|null} t
 * @returns {string}
 */
export function formatTaskTime(t) {
  if (!t) return "Hela dagen";
  if (typeof t === "string") return t.trim() || "Hela dagen";

  if (typeof t === "object") {
    // Prevent rendering "[object Object]" if data was somehow deeply nested/corrupted
    let s = t.start;
    let e = t.end;

    if (typeof s === "object" && s !== null) s = s.start || "";
    if (typeof e === "object" && e !== null) e = e.end || "";

    s = String(s || "").trim();
    e = String(e || "").trim();

    if (!s || s === "[object Object]") return "Hela dagen";
    return e && e !== "[object Object]" ? `${s}–${e}` : s;
  }
  
  return "Hela dagen";
}

/**
 * @typedef {Object} TaskData
 * @property {string|number} id - Unikt ID för uppgiften.
 * @property {string} title - Titel/rubrik.
 * @property {string} [description=''] - Beskrivning av uppgiften.
 * @property {boolean} [completed=false] - Om uppgiften är avklarad.
 * @property {string} status - Uppgiftens status (TASK_STATUSES).
 * @property {string} [assigned='Ingen'] - Primär ansvarig (bakåtkompatibilitet).
 * @property {Array<string>} [assignedTo=[]] - Lista med ansvariga namn.
 * @property {string|number} [deadline=0] - Deadline i YYYY-MM-DD eller 0.
 * @property {string} [createdAt] - ISO-datum för när uppgiften skapades.
 * @property {string|number|null} [contactId=null] - Länkad kontakts ID.
 * @property {string|null} [contactName=null] - Länkad kontakts namn.
 * @property {string} [closedReason=''] - Anledning till stängning.
 * @property {string} [comment=''] - Kommentar (bakåtkompatibilitet).
 * @property {number} [order=0] - Sorteringsordning inom samma statuskolumn.
 * @property {TaskTime|null} [taskTime=null] - Tid: {start, end} eller null = Hela dagen.
 * @property {string} [taskType=''] - Kategori t.ex. "Möte".
 * @property {string} [priority=''] - Prioritet t.ex. "Hög".
 */

/**
 * Skapar ett standardiserat uppgiftsobjekt med säkra standardvärden.
 * @param {TaskData} data - Indata för uppgiften.
 * @returns {TaskData} Ett komplett uppgiftsobjekt.
 */
export function createTask({
  id,
  title,
  description = "",
  completed = false,
  status,
  assigned = "Ingen",
  assignedTo = [],
  deadline = 0,
  createdAt = new Date().toISOString(),
  contactId = null,
  contactName = null,
  closedReason = "",
  comment = "",
  order = "",
  taskTime = null,
  taskType = "",
  priority = "",
  notes = [],
  completedDate
}) {
  return {
    id,
    title,
    description,
    completed,
    status,
    assigned,
    assignedTo,
    deadline,
    createdAt,
    contactId,
    contactName,
    closedReason,
    comment,
    order,
    // Normalize taskTime so both string ("08:30") and object ({start,end}) work
    taskTime: normalizeTaskTime(taskTime),
    taskType,
    priority,
    notes,
    ...(completedDate !== undefined ? { completedDate } : {})
  };
}