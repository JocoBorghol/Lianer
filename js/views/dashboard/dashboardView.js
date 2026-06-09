import { loadState } from "../../storage.js";
import { DASHBOARD_FILTER_KEY, FAVORITES_KEY } from "./dashboardConstants.js";
import {
  createLoadingCrmBox,
  getDashboardsToShow,
  getPeopleWithoutUnassigned,
  readJsonFromLocalStorage
} from "./dashboardHelpers.js";
import { renderDashboardControls } from "./dashboardControls.js";
import { createTaskBox } from "./dashboardTaskBox.js";
import { createCRMBox } from "./dashboardCrmBox.js";

let activeDashboardViewModel = null;

function renderDashboardError(container, error) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "dashboard";

  wrapper.innerHTML = `
    <h2>Dashboard</h2>
    <div class="dashboard-box" role="alert" style="padding:20px;">
      <strong>Kunde inte ladda dashboard-data.</strong>
      <p style="color:var(--text-dim); margin-top:8px;">
        ${error?.message ?? "Okänt fel."}
      </p>
    </div>
  `;

  container.append(wrapper);
}

function renderDashboardLoading(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "dashboard";

  wrapper.innerHTML = `
    <h2>Dashboard</h2>
    <div class="dashboard-box placeholder" style="padding:20px; text-align:center; color:var(--text-dim);">
      Laddar dashboard-data från API...
    </div>
  `;

  container.append(wrapper);
}

function getDashboardData() {
  if (!activeDashboardViewModel) {
    return {
      state: loadState(),
      allContacts: []
    };
  }

  return {
    state: activeDashboardViewModel.getDashboardState(),
    allContacts: activeDashboardViewModel.getContacts()
  };
}

export async function renderDashboard(container, options = {}) {
  activeDashboardViewModel =
    options.dashboardViewModel
    ?? activeDashboardViewModel;

  container.innerHTML = "";

  if (activeDashboardViewModel) {
    renderDashboardLoading(container);

    try {
      await activeDashboardViewModel.init();

      const vmState = activeDashboardViewModel.getViewState();

      if (vmState.error) {
        renderDashboardError(container, vmState.error);
        return;
      }
    } catch (error) {
      console.error("Failed to initialize dashboard view model:", error);
      renderDashboardError(container, error);
      return;
    }
  }

  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "dashboard";

  const title = document.createElement("h2");
  title.textContent = "Dashboard";
  wrapper.append(title);

  renderDashboardControls({
    wrapper,
    onRefresh: async () => {
      if (activeDashboardViewModel?.refresh) {
        await activeDashboardViewModel.refresh();
      }

      renderDashboard(container, {
        dashboardViewModel: activeDashboardViewModel
      });
    }
  });

  container.append(wrapper);

  const { state, allContacts } = getDashboardData();

  const people = getPeopleWithoutUnassigned(state);
  const favorites = readJsonFromLocalStorage(FAVORITES_KEY, []);
  const activeFilter = localStorage.getItem(DASHBOARD_FILTER_KEY) || "Team";

  const dashboardsToShow = getDashboardsToShow({
    activeFilter,
    people,
    favorites
  });

  dashboardsToShow.forEach(name => {
    const row = document.createElement("div");
    row.className = "dashboard-row";

    const taskBox = createTaskBox({
      name,
      state,
      favorites,
      onRefresh: () => renderDashboard(container, {
        dashboardViewModel: activeDashboardViewModel
      })
    });

    const crmBox = createCRMBox({
      name,
      allContacts,
      state
    });

    row.append(taskBox, crmBox);
    wrapper.append(row);
  });
}