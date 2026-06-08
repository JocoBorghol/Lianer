import { FAVORITES_KEY, TASK_DASHBOARD_STATUSES } from "./dashboardConstants.js";
import {
  createDashboardBoxHeader,
  createDashboardTotal,
  createWeeklyTargetGroup,
  getStartOfCurrentWeek,
  getTeamName,
  readJsonFromLocalStorage
} from "./dashboardHelpers.js";
import { createStatusGroup } from "./createStatusGroup.js";

export function createTaskBox({ name, state, favorites, onRefresh }) {
  const box = document.createElement("div");
  box.className = "dashboard-box";

  const teamName = getTeamName(state);
  const title = name === "Team"
    ? `${teamName} – Uppgifter`
    : `${name} – Uppgifter`;

  const { header } = createDashboardBoxHeader(title);

  if (name !== "Team") {
    header.append(createFavoriteButton({ name, favorites, onRefresh }));
  }

  box.append(header);

  const tasks = state.tasks || [];

  const filteredTasks = tasks.filter(task =>
    task.status !== "Stängd" && task.status !== "CLOSED"
  );

  const relevantTasks = name === "Team"
    ? filteredTasks
    : filteredTasks.filter(task =>
        (task.assignedTo && task.assignedTo.includes(name)) ||
        task.assigned === name
      );

  const totalCount = relevantTasks.length;

  box.append(createDashboardTotal(`Totalt: ${totalCount}`, {
    marginBottom: name === "Team" ? "0px" : undefined
  }));

  if (name === "Team") {
    const unassignedCount = relevantTasks.filter(task => task.assigned === "Ingen").length;

    box.append(createDashboardTotal(
      `Lediga: <span style="color: var(--accent-cyan); font-weight: 700;">${unassignedCount}</span>`,
      { marginTop: "0px" }
    ));
  }

  appendTaskWeeklyTarget({ box, relevantTasks, state });
  appendTaskStatusGroups({ box, relevantTasks, totalCount });

  return box;
}

function createFavoriteButton({ name, favorites, onRefresh }) {
  const star = document.createElement("button");
  star.className = `dashboard-star ${favorites.includes(name) ? "is-active" : ""}`;
  star.innerHTML = favorites.includes(name) ? "★" : "☆";

  star.onclick = () => {
    const currentFavorites = readJsonFromLocalStorage(FAVORITES_KEY, []);

    const updatedFavorites = currentFavorites.includes(name)
      ? currentFavorites.filter(favorite => favorite !== name)
      : [...currentFavorites, name];

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

    onRefresh();
  };

  return star;
}

function appendTaskWeeklyTarget({ box, relevantTasks, state }) {
  const weeklyTarget = state.settings?.weeklyTarget || 5;
  const now = new Date();
  const startOfWeek = getStartOfCurrentWeek(now);

  const completedThisWeek = relevantTasks.filter(task => {
    if (task.status !== "Klar") return false;

    const doneDate = task.completedDate || task.updatedAt || task.createdAt;

    if (!doneDate) return true;

    const taskDate = new Date(doneDate);

    return taskDate >= startOfWeek && taskDate <= now;
  }).length;

  const targetPercent = Math.min(
    100,
    Math.round((completedThisWeek / weeklyTarget) * 100)
  );

  box.append(createWeeklyTargetGroup({
    label: "VECKOMÅL (UPPGIFTER)",
    completed: completedThisWeek,
    target: weeklyTarget,
    percent: targetPercent
  }));
}

function appendTaskStatusGroups({ box, relevantTasks, totalCount }) {
  TASK_DASHBOARD_STATUSES.forEach(status => {
    const statusTasks = relevantTasks.filter(task => task.status === status.key);

    const percent = totalCount === 0
      ? 0
      : Math.round((statusTasks.length / totalCount) * 100);

    box.append(createStatusGroup({
      label: status.key,
      count: statusTasks.length,
      cssClass: status.css,
      percent,
      items: statusTasks.map(task => task.title)
    }));
  });
}