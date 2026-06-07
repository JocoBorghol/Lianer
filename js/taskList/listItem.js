import { TASK_STATUSES } from "../status.js";
import { formatTaskTime } from "../data/tasks.js";
import { getPeople } from "../people/peopleService.js";
import { loadState } from "../storage.js";

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 0 || dateStr === "Nyss") return "Nyss";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('sv-SE', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const renderAssigneeAvatars = (assignedNames = []) => {
  const container = document.createElement("div");
  container.className = "assignee-avatars-list";
  container.setAttribute("role", "button");
  container.setAttribute("tabindex", "0");
  container.setAttribute("aria-label", "Hantera ansvariga");

  if (!assignedNames || assignedNames.length === 0 || (assignedNames.length === 1 && assignedNames[0] === "Ingen")) {
    const empty = document.createElement("span");
    empty.className = "avatar-empty glow-up-btn";
    empty.innerHTML = "<span class='status-dot'></span> Ledig";
    container.append(empty);
    return container;
  }

  const validNames = assignedNames.filter(name => name && name !== "Ingen");
  const allPeople = getPeople().filter(name => name !== "Ingen");
  
  // If all team members are assigned
  const isFullTeam = validNames.length > 0 && validNames.length >= allPeople.length && allPeople.length > 0;

  if (isFullTeam) {
    const teamBadge = document.createElement("div");
    teamBadge.className = "team-badge full-team tooltip-container";
    teamBadge.setAttribute("aria-label", validNames.join(", "));
    teamBadge.setAttribute("role", "text");
    teamBadge.setAttribute("tabindex", "0");
    const stateUrl = loadState();
    const currentTeamName = stateUrl?.settings?.teamName || "TEAM MALMÖ";
    teamBadge.textContent = currentTeamName.toUpperCase();
    container.append(teamBadge);
    return container;
  }

  validNames.forEach((name) => {
    const avatar = document.createElement("div");
    avatar.className = "assignee-avatar-circle tooltip-container";
    avatar.setAttribute("aria-label", name);
    avatar.setAttribute("role", "text");
    avatar.setAttribute("tabindex", "0");

    // Plockar ut initialerna
    const initials = name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2).toUpperCase();
    avatar.textContent = initials;

    container.append(avatar);
  });

  return container;
};

export const listItem = (task, actions = {}) => {
  const safeActions = {
    onNavigate: actions.onNavigate ?? (() => {}),
    onEditTask: actions.onEditTask ?? (() => {}),
    onMoveTask: actions.onMoveTask ?? (() => {}),
    onChangeStatus: actions.onChangeStatus ?? (() => {}),
    onDeleteTask: actions.onDeleteTask ?? (() => {})
  };

  const isClosed = task.status === TASK_STATUSES.CLOSED;
  const isDone = task.status === TASK_STATUSES.DONE;
  const isTodo = task.status === TASK_STATUSES.TODO;

  const div = document.createElement("div");
  let cardClass = `listItem ${isClosed ? "is-closed" : ""}`;
  if (task.priority === "Hög") cardClass += " priority-high";
  if (task.taskType === "Möte") cardClass += " task-type-meeting";
  div.className = cardClass;
  div.setAttribute("role", "listitem");
  div.setAttribute("tabindex", "0");

  // DRAG AND DROP API
  div.setAttribute("draggable", "true");
  div.setAttribute("data-task-id", task.id);
  
  div.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    // Timeout is needed so drag image captures visible state before applying opacity
    setTimeout(() => div.classList.add("dragging"), 0);
  });
  
  div.addEventListener("dragend", () => {
    div.classList.remove("dragging");
  });

  const headerRow = document.createElement("div");
  headerRow.className = "card-header-row";

  const dateRow = document.createElement("div");
  dateRow.className = "date-row";

  // Time chip
  const timeLabel = task.taskTime ? formatTaskTime(task.taskTime) : "";
  const timeChipHtml = task.taskTime
    ? `<div class="meta-item" role="group" aria-label="Tid: ${timeLabel}"><span class="meta-label" aria-hidden="true">TID</span><span class="meta-value" aria-hidden="true">${timeLabel}</span></div>`
    : "";

  // Priority chip
  const prioChipHtml = task.priority === "Hög"
    ? `<span class="task-priority-chip" aria-label="Prioritet: Hög">🔴 Hög</span>`
    : "";

  dateRow.innerHTML = `
    <div class="meta-item" role="group" aria-label="Skapad: ${formatDate(task.createdAt)}"><span class="meta-label" aria-hidden="true">SKAPAD</span><span class="meta-value" aria-hidden="true">${formatDate(task.createdAt)}</span></div>
    ${timeChipHtml}${prioChipHtml}
  `;

  if (task.deadline) {
    const isOverdue = new Date(task.deadline) < new Date() && !isDone && !isClosed;
    dateRow.innerHTML += `
      <div class="meta-item ${isOverdue ? "deadline-overdue" : ""}" role="group" aria-label="Deadline: ${formatDate(task.deadline)}">
        <span class="meta-label" aria-hidden="true">DEADLINE</span><span class="meta-value" aria-hidden="true">${formatDate(task.deadline)}</span>
      </div>
    `;
  }

  const badge = document.createElement("div");
  badge.className = "statusBadge hero-badge";
  badge.setAttribute("data-status", task.status);
  badge.textContent = task.status;

  headerRow.append(dateRow, badge);

  const mainContent = document.createElement("div");
  mainContent.className = "taskMainContent";
  mainContent.innerHTML = `
    <h3 class="taskTitle highlight-title">${task.title || "Utan titel"}</h3>
    <p class="taskDescription">${task.description || "Ingen beskrivning."}</p>
  `;

  const hasNotes = task.notes && task.notes.length > 0;
  
  if (hasNotes) {
    const latestNote = task.notes[task.notes.length - 1];
    const noteText = typeof latestNote === 'object' ? (latestNote.text || latestNote.content || "") : latestNote;
    if (noteText) {
      mainContent.innerHTML += `
        <div class="task-latest-note">
          <strong style="color: var(--text-main); display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Senaste Notis</strong>
          ${noteText}
        </div>
      `;
    }
  }

  if ((task.contactId && task.contactName) || hasNotes) {
    const extraRow = document.createElement("div");
    extraRow.className = "task-extra-row";

    if (task.contactId && task.contactName) {
      const linkDiv = document.createElement("div");
      linkDiv.className = "task-contact-pill tooltip-container";
      linkDiv.setAttribute("aria-label", "Gå till kontakt");
      linkDiv.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px; margin-right:2px;">link</span> Kontakt: ${task.contactName} <span class="material-symbols-rounded arrow-icon">arrow_outward</span>`;

      linkDiv.onclick = (e) => {
        e.stopPropagation();
        safeActions.onNavigate('contacts', { highlightId: task.contactId });
      };

      extraRow.append(linkDiv);
    }

    if (hasNotes) {
      const noteBadge = document.createElement("div");
      noteBadge.className = "task-note-indicator tooltip-container";
      noteBadge.setAttribute("aria-label", `Denna uppgift har ${task.notes.length} notering(ar)`);
      noteBadge.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px;">chat</span>`;
      extraRow.append(noteBadge);
    }

    mainContent.append(extraRow);
  }

  const footer = document.createElement("div");
  footer.className = "taskFooter row-layout";

  let assignedArray = task.assignedTo || [];
  if (assignedArray.length === 0 && task.assigned) assignedArray = [task.assigned];

  const avatars = renderAssigneeAvatars(assignedArray);

  const openEditDialog = () => safeActions.onEditTask(task);

  avatars.onclick = (e) => {
    e.stopPropagation();
    openEditDialog();
  };
  avatars.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openEditDialog();
    }
  };

  footer.append(avatars);

  const controls = document.createElement("nav");
  controls.className = "taskControls command-bar";
  controls.setAttribute("aria-label", "Uppgiftskontroller");

  const addBtn = (icon, label, action, className = "") => {
    const btn = document.createElement("button");
    btn.className = `controlBtn ${className}`;
    btn.innerHTML = icon;
    btn.setAttribute("aria-label", label);
    btn.onclick = (e) => { e.stopPropagation(); action(); };
    controls.append(btn);
  };

  addBtn("↑", "Flytta upp", () => safeActions.onMoveTask(task.id, "up"));
  addBtn("↓", "Flytta ner", () => safeActions.onMoveTask(task.id, "down"));

  if (!isTodo && !isClosed) {
    const prevStatus = isDone ? TASK_STATUSES.IN_PROGRESS : TASK_STATUSES.TODO;
    addBtn("←", "Flytta vänster", () => safeActions.onChangeStatus(task.id, prevStatus));
  }
  if (!isDone && !isClosed) {
    const nextStatus = isTodo ? TASK_STATUSES.IN_PROGRESS : TASK_STATUSES.DONE;
    addBtn("→", "Flytta höger", () => safeActions.onChangeStatus(task.id, nextStatus));
  }

  if (!isClosed) {
    addBtn('<span class="material-symbols-rounded">edit</span>', "Redigera", openEditDialog, "edit-btn");
  }

  addBtn("✕", "Ta bort", () => safeActions.onDeleteTask(task), "delete-btn");

  footer.append(controls);
  div.append(headerRow, mainContent, footer);

  // Klick på själva kortet (men inte knapparna) för att expandera/kollapsa
  div.addEventListener("click", (e) => {
    if (e.target.closest('.taskControls') || e.target.closest('.assignee-avatars-list') || e.target.closest('.task-contact-pill')) {
      return;
    }
    div.classList.toggle('expanded');
  });

  return div;
};
