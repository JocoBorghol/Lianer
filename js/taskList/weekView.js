import { TASK_STATUSES } from "../status.js";
import { openTaskDialog } from "../menu/openTaskDialog.js";
import { formatTaskTime } from "../data/tasks.js";
import { startOfWeekMonday, toDateStr } from "./dateHelpers.js";

const DAYS_SV = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

/** Renders the week-view: 7 day columns */
// Uppdaterad: Använder viewDate för att visa rätt vecka
export function renderWeekView(tasks, viewDate, taskService) {
  const grid = document.createElement("div");
  grid.className = "week-view-grid";
  grid.setAttribute("role", "region");
  grid.setAttribute("aria-label", "Veckovy");

  const monday = startOfWeekMonday(viewDate);
  const today = toDateStr(new Date());

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dayStr = toDateStr(day);
    const isToday = dayStr === today;

    const col = document.createElement("div");
    col.className = `week-day-col ${isToday ? "week-day-today" : ""}`;
    col.setAttribute("aria-label", `${DAYS_SV[i]} ${dayStr}`);

    const colHeader = document.createElement("div");
    colHeader.className = "week-day-header";
    colHeader.innerHTML = `<span class="week-day-name">${DAYS_SV[i]}</span><span class="week-day-date">${day.getDate()}/${day.getMonth() + 1}</span>`;
    col.append(colHeader);

    // Tasks whose deadline falls on this day
    const dayTasks = tasks
      .filter(t => t.deadline === dayStr && t.status !== TASK_STATUSES.CLOSED)
      .sort((a, b) => {
        const aStart = a.taskTime?.start || a.taskTime || "99:99";
        const bStart = b.taskTime?.start || b.taskTime || "99:99";
        return aStart.localeCompare(bStart);
      });

    if (dayTasks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "week-day-empty";
      empty.textContent = "Inga uppgifter";
      col.append(empty);
    } else {
      dayTasks.forEach(t => {
        const chip = document.createElement("div");
        const timeLabel = formatTaskTime(t.taskTime);
        chip.className = `week-task-chip week-chip-${t.status.replace(/\s/g,'').toLowerCase()}${t.priority === "Hög" ? " week-chip-high" : ""}`;
        chip.setAttribute("role", "button"); chip.setAttribute("tabindex", "0");
        chip.innerHTML = `${t.taskTime ? `<span class="week-task-time">${t.taskType === "Möte" ? "📅" : "🕐"} ${timeLabel}</span>` : ""}<span class="week-task-title">${t.title}</span>${t.priority === "Hög" ? "<span class='week-prio-dot'>🔴</span>" : ""}`;
        chip.onclick = () => openTaskDialog({ taskService, taskToEdit: t });
        chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskDialog({ taskService, taskToEdit: t }); } };
        col.append(chip);
      });
    }
    grid.append(col);
  }
  return grid;
}
