import { loadState } from "../storage.js";

const FAVORITES_KEY = "dashboard:favorites";

const STATUSES = [
  { key: "Att göra", css: "todo" },
  { key: "Pågår", css: "progress" },
  { key: "Klar", css: "done" }
];

// Helper for creating status groups to reduce duplication
function createStatusGroup({ label, count, color, cssClass, percent, items }) {
  const group = document.createElement("div");
  group.className = "status-group";

  const toggle = document.createElement("button");
  toggle.className = "status-toggle";

  // Use .dot class with explicit color or css class
  let dotHtml = "";
  if (cssClass) {
    dotHtml = `<span class="dot ${cssClass}"></span>`;
  } else {
    dotHtml = `<span class="dot" style="background:${color}; box-shadow:0 0 8px ${color};"></span>`;
  }

  toggle.innerHTML = `${dotHtml}<span>${label}: ${count}</span><span class="chevron">▾</span>`;
  toggle.addEventListener("click", () => group.classList.toggle("open"));

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";

  let barHtml = "";
  if (cssClass) {
    barHtml = `<div class="progress-bar ${cssClass}" style="width: ${percent}%"></div>`;
  } else {
    barHtml = `<div class="progress-bar" style="width: ${percent}%; background:${color}; box-shadow:0 0 10px ${color};"></div>`;
  }
  progressWrap.innerHTML = barHtml;

  const list = document.createElement("ul");
  list.className = "status-list";

  if (!items || items.length === 0) {
    list.innerHTML = `<li style="font-style:italic; opacity:0.5;">Tomt</li>`;
  } else {
    items.forEach(itemText => {
      const li = document.createElement("li");
      li.textContent = itemText;
      li.className = "dashboard-item-text";
      list.append(li);
    });

    if (items.hasMore) { // Check if we added a property for "more" items
      // (Not implemented in this simple helper, but handled in caller)
    }
  }

  group.append(toggle, progressWrap, list);
  return group;
}

export async function renderDashboard(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "dashboard";

  const title = document.createElement("h2");
  title.textContent = "Dashboard";
  wrapper.append(title);

  // ---------- KONTROLLER ----------
  renderControls(wrapper, container);

  // Append wrapper IMMEDIATELY so controls are visible
  container.append(wrapper);

  // här
  const state = loadState();
  const people = (state.people || []).filter(p => p !== "Ingen");
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  // Determine what to show
  const activeFilter = localStorage.getItem("dashboardViewFilter") || "Team";
  let dashboardsToShow = ["Team"];

  if (activeFilter === "ALLA") {
    dashboardsToShow = ["Team", ...people];
  } else if (activeFilter === "Team") {
    dashboardsToShow = ["Team", ...favorites.filter(n => people.includes(n))];
  } else {
    // Specific person: Show Team + Person
    dashboardsToShow = ["Team", activeFilter].filter((v, i, a) => a.indexOf(v) === i);
  }

  const crmBoxContainers = [];

  // Render Rows completely synchronously
  dashboardsToShow.forEach(name => {
    const row = document.createElement("div");
    row.className = "dashboard-row";

    // 1. Task Box (Synchronous)
    const taskBox = createTaskBox(name, state, favorites, wrapper, container);

    // 2. CRM Box (Placeholder)
    const teamName = state.settings?.teamName || "Mitt Team";
    const crmBoxContainer = document.createElement("div");
    crmBoxContainer.className = "dashboard-box placeholder";
    crmBoxContainer.innerHTML = `<div class="dashboard-box-header"><h3>${name === "Team" ? `${teamName} – CRM` : `${name} – CRM`}</h3></div><div style="padding:20px; text-align:center; color:var(--text-dim)">Laddar CRM-data...</div>`;

    row.append(taskBox, crmBoxContainer);
    wrapper.append(row);

    crmBoxContainers.push({ name, container: crmBoxContainer });
  });

  // Fetch Contacts asynchronously to prevent LCP blocking
  import("../utils/contactsDb.js").then(async ({ getAllContacts, initContactsDB }) => {
    try {
      await initContactsDB();
      const allContacts = await getAllContacts();

      crmBoxContainers.forEach(({ name, container }) => {
        const crmBox = createCRMBox(name, allContacts, state);
        container.replaceWith(crmBox);
      });
    } catch (e) {
      console.error("Failed to load contacts for dashboard", e);
      crmBoxContainers.forEach(({ container }) => {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:red">Kunde inte ladda CRM-data.</div>`;
      });
    }
  }).catch(e => {
    console.error("Failed to import contactsDb.js for dashboard", e);
  });
}

function createTaskBox(name, state, favorites, wrapper, container) {
  const box = document.createElement("div");
  box.className = "dashboard-box";
  const teamName = state.settings?.teamName || "Mitt Team";

  const header = document.createElement("div");
  header.className = "dashboard-box-header";

  const heading = document.createElement("h3");
  heading.textContent = name === "Team" ? `${teamName} – Uppgifter` : `${name} – Uppgifter`;
  header.append(heading);

  if (name !== "Team") {
    const star = document.createElement("button");
    star.className = `dashboard-star ${favorites.includes(name) ? "is-active" : ""}`;
    star.innerHTML = favorites.includes(name) ? "★" : "☆";
    star.onclick = () => {
      const currentFavs = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
      const updated = currentFavs.includes(name)
        ? currentFavs.filter(f => f !== name)
        : [...currentFavs, name];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      renderDashboard(container); // Re-render entire dashboard
    };
    header.append(star);
  }
  box.append(header);

  const tasks = state.tasks || [];
  const filteredTasks = tasks.filter(t => t.status !== "Stängd" && t.status !== "CLOSED");
  const relevantTasks = name === "Team"
    ? filteredTasks
    : filteredTasks.filter(t => (t.assignedTo && t.assignedTo.includes(name)) || t.assigned === name);
  const totalCount = relevantTasks.length;

  const total = document.createElement("div");
  total.className = "dashboard-total";
  total.innerHTML = `Totalt: ${totalCount}`;

  // Add margin if Team to fit unassigned
  if (name === "Team") total.style.marginBottom = "0px";
  box.append(total);

  if (name === "Team") {
    const unassignedCount = relevantTasks.filter(t => t.assigned === "Ingen").length;
    const unassignedDiv = document.createElement("div");
    unassignedDiv.className = "dashboard-total";
    unassignedDiv.style.marginTop = "0px";
    unassignedDiv.innerHTML = `Lediga: <span style="color: var(--accent-cyan); font-weight: 700;">${unassignedCount}</span>`;
    box.append(unassignedDiv);
  }

  // Weekly Target
  const weeklyTarget = state.settings?.weeklyTarget || 5;
  const now = new Date();
  const day = now.getDay() || 7; // Sunday = 0, Monday = 1, ..., Saturday = 6. Convert to 1-7 where Monday is 1.
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day + 1); // Set to Monday of current week

  const completedThisWeek = relevantTasks.filter(t => {
    if (t.status !== "Klar") return false;
    const doneDate = t.completedDate || t.updatedAt || t.createdAt;
    if (!doneDate) return true; // Klar without any date = count it
    const taskDate = new Date(doneDate);
    return taskDate >= startOfWeek && taskDate <= now; // Ensure it's within the current week up to now
  }).length;

  const targetPercent = Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100));

  // Custom group for Weekly Target
  const targetGroup = document.createElement("div");
  targetGroup.className = "status-group open";
  targetGroup.style.marginTop = "12px";
  targetGroup.innerHTML = `
        <div class="status-toggle" style="cursor:default">
            <span class="dot" style="background:#8b5cf6; box-shadow:0 0 10px #8b5cf6;"></span>
            <span style="flex:1; color:var(--text-weekly-target); font-weight:700; letter-spacing:0.5px;">VECKOMÅL (UPPGIFTER): ${completedThisWeek} / ${weeklyTarget}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width: ${targetPercent}%; background: #8b5cf6; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);"></div></div>
    `;
  box.append(targetGroup);

  STATUSES.forEach(status => {
    const statusTasks = relevantTasks.filter(t => t.status === status.key);
    const percent = totalCount === 0 ? 0 : Math.round((statusTasks.length / totalCount) * 100);

    const group = createStatusGroup({
      label: status.key,
      count: statusTasks.length,
      cssClass: status.css,
      percent: percent,
      items: statusTasks.map(t => t.title)
    });
    box.append(group);
  });

  return box;
}

function createCRMBox(name, allContacts, state) {
  const box = document.createElement("div");
  box.className = "dashboard-box";
  const teamName = state.settings?.teamName || "Mitt Team";

  const header = document.createElement("div");
  header.className = "dashboard-box-header";
  const heading = document.createElement("h3");

  heading.textContent = name === "Team" ? `${teamName} – CRM` : `${name} – CRM`;
  header.append(heading);
  box.append(header);

  // Filter contacts
  const relevantContacts = (name === "Team")
    ? allContacts
    : allContacts.filter(c => c.assignedTo === name);

  // Calculate total excluding "Förlorad"
  const activeContacts = relevantContacts.filter(c => c.status !== "Förlorad");
  const totalCount = activeContacts.length;

  const total = document.createElement("div");
  total.className = "dashboard-total";
  total.innerHTML = `Totalt: ${totalCount}`; // Use innerHTML to allow styling

  // Add margin if Team to fit unassigned
  if (name === "Team") total.style.marginBottom = "0px";
  box.append(total);

  if (name === "Team") {
    const unassignedCount = relevantContacts.filter(c => !c.assignedTo || c.assignedTo === "Ingen").length;
    const unassignedDiv = document.createElement("div");
    unassignedDiv.className = "dashboard-total";
    unassignedDiv.style.marginTop = "0px";
    unassignedDiv.innerHTML = `Lediga: <span style="color: var(--accent-cyan); font-weight: 700;">${unassignedCount}</span>`;
    box.append(unassignedDiv);
  }

  // CRM Weekly Target
  const weeklyTarget = state.settings?.weeklyCRMTarget || 5;
  const now = new Date();
  const day = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day + 1);

  // Count contacts that are "Klar" AND completed this week
  // Initial scan: fallback to lastContactDate if completedAt is missing
  const completedThisWeek = relevantContacts.filter(c => {
    if (c.status !== "Klar") return false;
    const doneDate = c.completedAt || c.lastContactDate;
    if (!doneDate) return true; // Klar without any date = count it
    return new Date(doneDate) >= startOfWeek;
  }).length;

  const targetPercent = Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100));

  // Custom group for Weekly Target
  const targetGroup = document.createElement("div");
  targetGroup.className = "status-group open";
  targetGroup.style.marginTop = "12px";
  targetGroup.innerHTML = `
        <div class="status-toggle" style="cursor:default">
            <span class="dot" style="background:#8b5cf6; box-shadow:0 0 10px #8b5cf6;"></span>
            <span style="flex:1; color:var(--text-weekly-target); font-weight:700; letter-spacing:0.5px;">VECKOMÅL (CRM): ${completedThisWeek} / ${weeklyTarget}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width: ${targetPercent}%; background: #8b5cf6; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);"></div></div>
    `;
  box.append(targetGroup);

  // CRM Statuses
  const crmStatuses = [
    { key: "Ej kontaktad", css: "todo" },
    { key: "Pågående", css: "progress" },
    { key: "Klar", css: "done" },
    { key: "Förlorad", css: "lost" },
    { key: "Återkom", css: "callback" }
  ];

  crmStatuses.forEach(status => {
    const statusContacts = relevantContacts.filter(c => c.status === status.key);
    const percent = totalCount === 0 ? 0 : Math.round((statusContacts.length / totalCount) * 100);

    // Prepare items (Company + Name)
    const items = statusContacts.slice(0, 10).map(c => c.company ? `${c.company} (${c.name})` : c.name);
    if (statusContacts.length > 10) {
      items.push(`...och ${statusContacts.length - 10} till`);
    }

    const group = createStatusGroup({
      label: status.key,
      count: statusContacts.length,
      cssClass: status.css,
      percent: percent,
      items: items
    });
    box.append(group);
  });

  return box;
}

// Keep renderControls and remove renderTaskDashboard/renderCRMDashboard (old versions)
function renderControls(wrapper, container) {
  // ... (implementation same as before, see context below or assume unchanged if outside replacement range)
  const state = loadState();
  const people = (state.people || []).filter(p => p !== "Ingen");
  const teamName = state.settings?.teamName || "Mitt Team";
  let currentFilter = localStorage.getItem("dashboardViewFilter") || "Team";

  const controls = document.createElement("div");
  controls.className = "dashboard-controls";
  controls.style.marginBottom = "24px"; // Add spacing
  controls.style.position = "relative";
  controls.style.zIndex = "50";

  const select = document.createElement("select");
  select.id = "dashboard-filter-select";
  select.tabIndex = 0;
  select.className = "taskFilterSelect";

  const teamOption = document.createElement("option");
  teamOption.value = "Team";
  teamOption.textContent = `${teamName} & Favoriter`;
  select.append(teamOption);

  const allOption = document.createElement("option");
  allOption.value = "ALLA";
  allOption.textContent = "--- Visa alla dashboards ---";
  select.append(allOption);

  people.forEach(person => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    select.append(option);
  });

  select.value = currentFilter;
  select.addEventListener("change", () => {
    localStorage.setItem("dashboardViewFilter", select.value);
    renderDashboard(container).then(() => {
      setTimeout(() => {
        const el = document.getElementById("dashboard-filter-select");
        if (el) el.focus();
      }, 50);
    });
  });

  controls.append(select);
  wrapper.append(controls);
}