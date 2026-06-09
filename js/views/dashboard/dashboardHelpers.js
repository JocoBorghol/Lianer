export function readJsonFromLocalStorage(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function getPeopleWithoutUnassigned(state) {
  return (state.people || []).filter(person => person !== "Ingen");
}

export function getTeamName(state) {
  return state.settings?.teamName || "Mitt Team";
}

export function getStartOfCurrentWeek(now = new Date()) {
  const day = now.getDay() || 7;
  const startOfWeek = new Date(now);

  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day + 1);

  return startOfWeek;
}

export function getDashboardsToShow({ activeFilter, people, favorites }) {
  if (activeFilter === "ALLA") {
    return ["Team", ...people];
  }

  if (activeFilter === "Team") {
    return ["Team", ...favorites.filter(name => people.includes(name))];
  }

  return ["Team", activeFilter].filter((value, index, array) =>
    array.indexOf(value) === index
  );
}

export function createDashboardBoxHeader(title) {
  const header = document.createElement("div");
  header.className = "dashboard-box-header";

  const heading = document.createElement("h3");
  heading.textContent = title;

  header.append(heading);

  return { header, heading };
}

export function createDashboardTotal(html, options = {}) {
  const total = document.createElement("div");
  total.className = "dashboard-total";
  total.innerHTML = html;

  if (options.marginBottom != null) {
    total.style.marginBottom = options.marginBottom;
  }

  if (options.marginTop != null) {
    total.style.marginTop = options.marginTop;
  }

  return total;
}

export function createWeeklyTargetGroup({ label, completed, target, percent }) {
  const group = document.createElement("div");
  group.className = "status-group open";
  group.style.marginTop = "12px";

  group.innerHTML = `
    <div class="status-toggle" style="cursor:default">
      <span class="dot" style="background:#8b5cf6; box-shadow:0 0 10px #8b5cf6;"></span>
      <span style="flex:1; color:var(--text-weekly-target); font-weight:700; letter-spacing:0.5px;">${label}: ${completed} / ${target}</span>
    </div>
    <div class="progress-wrap">
      <div class="progress-bar" style="width: ${percent}%; background: #8b5cf6; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);"></div>
    </div>
  `;

  return group;
}

export function createLoadingCrmBox({ name, state }) {
  const teamName = getTeamName(state);

  const box = document.createElement("div");
  box.className = "dashboard-box placeholder";

  box.innerHTML = `
    <div class="dashboard-box-header">
      <h3>${name === "Team" ? `${teamName} – CRM` : `${name} – CRM`}</h3>
    </div>
    <div style="padding:20px; text-align:center; color:var(--text-dim)">
      Laddar CRM-data...
    </div>
  `;

  return box;
}