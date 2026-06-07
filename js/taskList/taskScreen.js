import { loadState } from "../storage.js";
import { TASK_STATUSES } from "../status.js";
import { addTaskDialog } from "../comps/dialog.js";
import { openTaskDialog } from "../menu/openTaskDialog.js";
import { taskList } from "../taskList/taskList.js";
import { formatTaskTime } from "../data/tasks.js";
import { getWelcomeHTML, attachWelcomeEvents } from "../comps/welcomeOverlay.js";

// ─── Date helper ───
function startOfWeekMonday() {
  const d = new Date();
  const day = d.getDay() || 7; // Sun=0 → 7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS_SV = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

/** Format Date to YYYY-MM-DD */
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Renders the week-view: 7 day columns */
function renderWeekView(tasks) {
  const grid = document.createElement("div");
  grid.className = "week-view-grid";
  grid.setAttribute("role", "region");
  grid.setAttribute("aria-label", "Veckovy");

  const monday = startOfWeekMonday();
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
        chip.onclick = () => addTaskDialog(t);
        chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTaskDialog(t); } };
        col.append(chip);
      });
    }
    grid.append(col);
  }
  return grid;
}

/** Renders the day-view: 24h axis for today */
function renderDayView(tasks) {
  const wrapper = document.createElement("div");

  wrapper.className = "day-view-wrapper";
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "Dagsvy");

  const todayDate = new Date();
  const heading = document.createElement("h3");
  heading.className = "day-view-heading";
  heading.textContent = `Dagsplanering – ${todayDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}`;
  wrapper.append(heading);

  const activeTasks = tasks.filter(t => t.status !== TASK_STATUSES.CLOSED);
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
      chip.onclick = () => addTaskDialog(t);
      chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTaskDialog(t); } };
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
      const start = t.taskTime?.start || (typeof t.taskTime === "string" ? t.taskTime : "");
      return start && parseInt(start.split(':')[0]) === h;
    });
    hourTasks.forEach(t => {
      const chip = document.createElement("div");
      const timeLabel = formatTaskTime(t.taskTime);
      chip.className = `day-timed-chip day-chip-${t.status.replace(/\s/g,'').toLowerCase()}${t.priority === "Hög" ? " day-chip-high" : ""}${t.taskType === "Möte" ? " day-chip-meeting" : ""}`;
      chip.setAttribute("role", "button"); chip.setAttribute("tabindex", "0");
      chip.innerHTML = `<span class="day-chip-time">${t.taskType === "Möte" ? "📅" : "🕐"} ${timeLabel}</span><span class="day-chip-title">${t.title}</span>${t.priority === "Hög" ? "<span style='color:#ff4d4d;margin-left:auto;font-size:12px;'>🔴</span>" : ""}`;
      chip.onclick = () => addTaskDialog(t);
      chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTaskDialog(t); } };
      line.append(chip);
    });
    row.append(line);
    axis.append(row);
  }
  wrapper.append(axis);
  return wrapper;
}

/**
 * @file taskScreen.js
 * @description Hanterar huvudskärmen för uppgifter (Kanban-vyn).
 * Inkluderar filter för team/medlemmar och stöd för flera ansvariga per uppgift.
 */

/**
 * Skapar och returnerar huvudvyn för uppgiftshantering.
 * @returns {HTMLElement} Det sammansatta elementet för uppgiftsskärmen.
 */
export const taskScreen = ({ taskService, navigate }) => {
  const state = loadState();
  const people = state.people || []; // Array med strängar (namn)

  // Hämtar senast använda filter eller sätter standard till "Team"
  let currentFilter = localStorage.getItem("taskViewFilter") || "Team";
  let currentViewMode = localStorage.getItem("taskViewMode") || "board";

  const screenWrapper = document.createElement("main");
  screenWrapper.classList.add("taskScreenWrapper");
  screenWrapper.setAttribute("aria-label", "Projekttavla");

  const contentArea = document.createElement("div");
  contentArea.classList.add("taskContentArea");

  // ---------- VIEW MODE TOGGLE ----------
  const viewToggleBar = document.createElement("div");
  viewToggleBar.className = "view-toggle-bar";
  viewToggleBar.setAttribute("role", "group");
  viewToggleBar.setAttribute("aria-label", "Visa som");

  const viewModes = [
    { key: "board", label: "📦 Board" },
    { key: "week",  label: "📅 Vecka" },
    { key: "day",   label: "⏰ Dag" },
  ];
  viewModes.forEach(vm => {
    const btn = document.createElement("button");
    btn.className = `view-toggle-btn${currentViewMode === vm.key ? " active" : ""}`;
    btn.textContent = vm.label;
    btn.setAttribute("aria-pressed", String(currentViewMode === vm.key));
    btn.onclick = () => {
      currentViewMode = vm.key;
      localStorage.setItem("taskViewMode", vm.key);
      viewToggleBar.querySelectorAll(".view-toggle-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
      updateView(currentFilter);
    };
    viewToggleBar.append(btn);
  });

  // ---------- FILTERKONTROLLER (Semantisk Header) ----------
  const filterHeader = document.createElement("header");
  filterHeader.classList.add("taskFilterContainer");

  const filterLabel = document.createElement("label");
  filterLabel.setAttribute("for", "task-filter-select");
  filterLabel.classList.add("filterLabel");
  filterLabel.textContent = "Visa uppgifter för: ";

  const select = document.createElement("select");
  select.id = "task-filter-select";
  select.classList.add("taskFilterSelect");
  select.setAttribute("aria-controls", "task-board");

  // 1. Hela teamet
  const teamOption = document.createElement("option");
  teamOption.value = "Team";
  teamOption.textContent = "Hela Teamet";
  if (currentFilter === "Team") teamOption.selected = true;
  select.append(teamOption);

  const teamSeparator = document.createElement("option");
  teamSeparator.disabled = true;
  teamSeparator.textContent = "────────────────";
  select.append(teamSeparator);

  // 2. Alla medlemmar (Hanterar datan som strängar nu!)
  people.forEach(personName => {
    const option = document.createElement("option");
    option.value = personName; 
    // Om personen är "Ingen", visa det snyggare i listan
    option.textContent = (personName === "Ingen") ? "🟢 Lediga uppgifter" : personName;
    
    if (personName === currentFilter) option.selected = true;
    select.append(option);
  });

  const archiveSeparator = document.createElement("option");
  archiveSeparator.disabled = true;
  archiveSeparator.textContent = "────────────────";
  select.append(archiveSeparator);

  // 3. Arkivet
  const archiveOption = document.createElement("option");
  archiveOption.value = "Arkiv";
  archiveOption.textContent = "📁 Visa Stängda Uppgifter";
  if (currentFilter === "Arkiv") archiveOption.selected = true;
  select.append(archiveOption);

  /**
   * Uppdaterar Kanban-tavlan baserat på valt filter.
   * @param {string} selectedFilter - Namnet på personen, "Team" eller "Arkiv".
   */
  const updateView = (selectedFilter) => {
    contentArea.innerHTML = ""; 

    const tasks  = taskService.getTasks();

    // ═══════════════════════════════════════════════════════════════
    // EMPTY STATE – "Lianer Welcome Hero" (High-End Edition)
    // Visas om det inte finns NÅGRA uppgifter alls i systemet.
    // ═══════════════════════════════════════════════════════════════
    if (tasks.length === 0 && selectedFilter !== "Arkiv") {
      // Hide the filter bar (view toggle is inside it)
      filterHeader.style.display = "none";


      const emptyState = document.createElement("div");
      emptyState.className = "empty-state-container";
      emptyState.setAttribute("role", "region");
      emptyState.setAttribute("aria-label", "Välkommen till Lianer");

      emptyState.innerHTML = getWelcomeHTML(false);

      attachWelcomeEvents(emptyState, taskService, null);

      contentArea.append(emptyState);
      return;
    }

    // Show the filter bar (includes view toggle)
    filterHeader.style.display = "";


    // ── Week View ──
    if (currentViewMode === "week" && selectedFilter !== "Arkiv") {
      const filteredTasks = selectedFilter === "Team"
        ? tasks
        : tasks.filter(t => t.assignedTo?.includes(selectedFilter) || t.assigned === selectedFilter);
      contentArea.append(renderWeekView(filteredTasks));
      return;
    }

    // ── Day View ──
    if (currentViewMode === "day" && selectedFilter !== "Arkiv") {
      const filteredTasks = selectedFilter === "Team"
        ? tasks
        : tasks.filter(t => t.assignedTo?.includes(selectedFilter) || t.assigned === selectedFilter);
      contentArea.append(renderDayView(filteredTasks));
      return;
    }

    const board = document.createElement("div");
    board.id = "task-board";
    board.classList.add("taskBoard");
    board.setAttribute("role", "region");
    board.setAttribute("aria-live", "polite");

    // LOGIK FÖR ARKIV-VY (VG: Focus Management)
    if (selectedFilter === "Arkiv") {
      const archiveColumn = document.createElement("section");
      archiveColumn.className = "taskWrapper closed-tasks-archive";
      archiveColumn.setAttribute("aria-label", "Stängda uppgifter");
      
      const closedTasks = tasks.filter(t => t.status === TASK_STATUSES.CLOSED);
      archiveColumn.append(taskList(TASK_STATUSES.CLOSED, closedTasks, {
        taskService,
        navigate,
        onDropTask: (taskId, newStatus, prevOrderId, nextOrderId) => {
          if (taskService.updateTaskOrder) {
            taskService.updateTaskOrder(taskId, newStatus, prevOrderId, nextOrderId);
            window.dispatchEvent(new CustomEvent('renderApp'));
          } else {
            console.warn("updateTaskOrder missing in TaskService");
          }
        }
      }));
      
      board.append(archiveColumn);
    } 
    // LOGIK FÖR KANBAN-VY (Hanterar array-logik för flera ansvariga som strängar)
    else {
      // Filtrerar uppgifter: Visa alla om "Team", annars kolla om personens namn finns i assignedTo-arrayen
      const filteredTasks = selectedFilter === "Team" 
        ? tasks 
        : tasks.filter(t => {
            // Kontrollera först i den nya arrayen, fallback till gamla 'assigned'
            if (t.assignedTo && Array.isArray(t.assignedTo)) {
              // Buggfix: 'Ledig' = tom array ELLER explicit "Ingen"
              if (selectedFilter === "Ingen") {
                return t.assignedTo.length === 0 || t.assignedTo.includes("Ingen");
              }
              return t.assignedTo.includes(selectedFilter);
            }
            return t.assigned === selectedFilter;
          });

      const activeStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.DONE];
      
      activeStatuses.forEach(status => {
        const columnWrapper = document.createElement("section");
        columnWrapper.classList.add("taskWrapper");
        columnWrapper.setAttribute("data-status", status);
        columnWrapper.setAttribute("aria-label", `Kolumn: ${status}`);

        const columnTasks = filteredTasks
          .filter(t => t.status === status)
          .sort((a, b) => taskService._compareRank(a.order || "", b.order || ""));
          
        columnWrapper.append(taskList(status, columnTasks, {
          taskService,
          navigate,    // Skickar navigate funktion till listItems 
          onMoveTask: (id,dir) => {
            taskService.moveTask(id,dir);
            window.dispatchEvent(new CustomEvent('renderApp'));
          },
          onChangeStatus: (id, newStatus) => {
            taskService.changeStatus(id, newStatus);
            window.dispatchEvent(new CustomEvent('renderApp'));
          },
          onDeleteTask: (task) => {
            taskService.deleteTask(task.id);
            window.dispatchEvent(new CustomEvent('renderApp'));
          },
          onEditTask: (task) => openTaskDialog({ taskService, taskToEdit: task }),
          onDropTask: (taskId, newStatus, prevOrderId, nextOrderId) => {
            if (taskService.updateTaskOrder) {
              taskService.updateTaskOrder(taskId, newStatus, prevOrderId, nextOrderId);
              window.dispatchEvent(new CustomEvent('renderApp'));
            } else {
              console.warn("updateTaskOrder missing in TaskService");
            }
          }
        }));
        board.append(columnWrapper);
      });
    }

    contentArea.append(board);
  };

  // Eventlyssnare för filterändring
  select.addEventListener("change", (e) => {
    const newFilter = e.target.value;
    localStorage.setItem("taskViewFilter", newFilter);
    updateView(newFilter);
  });

  // Initial rendering
  updateView(currentFilter);

  // Merge filter + view toggle into one header strip
  filterHeader.append(filterLabel, select, viewToggleBar);
  screenWrapper.append(filterHeader, contentArea);



  return screenWrapper;
};