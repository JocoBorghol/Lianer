import { TASK_STATUSES } from "../status.js";
import { openTaskDialog } from "../menu/openTaskDialog.js";
import { formatTaskTime } from "../data/tasks.js";
import { toDateStr } from "./dateHelpers.js";

/** Renders the day-view: 24h axis for a specific date */
// Uppdaterad: Använder viewDate för planeringen
export function renderDayView(tasks, viewDate, taskService) {
  const wrapper = document.createElement("div");

  wrapper.className = "day-view-wrapper";
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "Dagsvy");

  const heading = document.createElement("h3");
  heading.className = "day-view-heading";
  heading.textContent = `Dagsplanering – ${viewDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}`;
  wrapper.append(heading);

  const viewDateStr = toDateStr(viewDate);
  const activeTasks = tasks.filter(t => t.status !== TASK_STATUSES.CLOSED && t.deadline === viewDateStr);
  const allDayTasks = activeTasks.filter(t => !t.taskTime);
  // Sort timed tasks by start time
  const timedTasks = activeTasks.filter(t => t.taskTime).sort((a, b) => {
    const aS = a.taskTime?.start || (typeof a.taskTime==="string" ? a.taskTime : "");
    const bS = b.taskTime?.start || (typeof b.taskTime==="string" ? b.taskTime : "");
    return aS.localeCompare(bS);
  });

  // All-day band
  if (allDayTasks.length > 0) {
    const allDayBand = document.createElement("div");
    allDayBand.className = "day-allday-band";
    const bandLabel = document.createElement("span");
    bandLabel.className = "day-allday-label";
    bandLabel.textContent = "Hela dagen";
    allDayBand.append(bandLabel);
    allDayTasks.forEach(t => {
      const chip = document.createElement("div");
      chip.className = `day-allday-chip day-chip-${t.status.replace(/\s/g,'').toLowerCase()}${t.priority === "Hög" ? " day-chip-high" : ""}`;
      chip.setAttribute("role", "button"); chip.setAttribute("tabindex", "0");
      chip.textContent = t.title;
      chip.onclick = () => openTaskDialog({ taskService, taskToEdit: t });
      chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskDialog({ taskService, taskToEdit: t }); } };
      allDayBand.append(chip);
    });
    wrapper.append(allDayBand);
  }

  // Time axis
  const axis = document.createElement("div");
  axis.className = "day-time-axis";

  // Render hour markers 6:00-23:00
  for (let h = 6; h <= 23; h++) {
    const row = document.createElement("div");
    row.className = "day-hour-row";
    const label = document.createElement("span");
    label.className = "day-hour-label";
    label.textContent = `${String(h).padStart(2,'0')}:00`;
    row.append(label);
    const line = document.createElement("div");
    line.className = "day-hour-line";

    const hourTasks = timedTasks.filter(t => {
      const start = t.taskTime?.start || (typeof t.taskTime === "string" ? t.taskTime.split('-')[0].trim() : "");
      return start && parseInt(start.split(':')[0]) === h;
    });

    hourTasks.forEach((t, index) => {
      const chip = document.createElement("div");
      
      // Calculate start and end times
      let startTime = t.taskTime?.start || t.taskTime;
      let endTime = t.taskTime?.end || "";
      if (typeof t.taskTime === "string" && t.taskTime.includes("-")) {
         [startTime, endTime] = t.taskTime.split("-").map(s => s.trim());
      }
      
      const startParts = startTime.split(":");
      const startMin = startParts.length > 1 ? parseInt(startParts[1]) : 0;
      
      let durationMins = 50; // default duration
      if (endTime) {
         const endParts = endTime.split(":");
         const endH = parseInt(endParts[0]);
         const endM = endParts.length > 1 ? parseInt(endParts[1]) : 0;
         durationMins = (endH * 60 + endM) - (h * 60 + startMin);
         if (durationMins < 30) durationMins = 30; // min height
      }

      const timeLabel = formatTaskTime(t.taskTime);
      chip.className = `day-timed-chip day-chip-${t.status.replace(/\s/g,'').toLowerCase()}${t.priority === "Hög" ? " day-chip-high" : ""}${t.taskType === "Möte" ? " day-chip-meeting" : ""}`;
      
      // Absolute positioning mapping 1 min = 1 px
      chip.style.top = `${startMin}px`;
      chip.style.height = `${durationMins}px`;
      
      // Prevent overlaps by offsetting them simply
      chip.style.left = `${(index * 150) + 10}px`;
      chip.style.width = "260px";

      chip.setAttribute("role", "button"); 
      chip.setAttribute("tabindex", "0");
      
      chip.innerHTML = `
        <div style="display:flex; width:100%; gap:8px; align-items:flex-start;">
            <span class="day-chip-time">${t.taskType === "Möte" ? "📅" : "🕐"} ${timeLabel}</span>
            <span class="day-chip-title" style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</span>
            ${t.priority === "Hög" ? "<span style='color:#ff4d4d;font-size:12px;flex-shrink:0;'>🔴</span>" : ""}
        </div>
      `;
      
      chip.onclick = () => openTaskDialog({ taskService, taskToEdit: t });
      chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskDialog({ taskService, taskToEdit: t }); } };
      line.append(chip);
    });
    row.append(line);
    axis.append(row);
  }
  wrapper.append(axis);
  return wrapper;
}
