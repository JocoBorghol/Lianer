import { loadState } from "../../storage.js";
import { DASHBOARD_FILTER_KEY } from "./dashboardConstants.js";
import { getPeopleWithoutUnassigned, getTeamName } from "./dashboardHelpers.js";

export function renderDashboardControls({ wrapper, onRefresh }) {
  const state = loadState();
  const people = getPeopleWithoutUnassigned(state);
  const teamName = getTeamName(state);
  const currentFilter = localStorage.getItem(DASHBOARD_FILTER_KEY) || "Team";

  const controls = document.createElement("div");
  controls.className = "dashboard-controls";
  controls.style.marginBottom = "24px";
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
    localStorage.setItem(DASHBOARD_FILTER_KEY, select.value);

    onRefresh().then(() => {
      setTimeout(() => {
        const el = document.getElementById("dashboard-filter-select");
        if (el) el.focus();
      }, 50);
    });
  });

  controls.append(select);
  wrapper.append(controls);
}