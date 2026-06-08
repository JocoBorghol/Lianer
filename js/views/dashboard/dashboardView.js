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

export async function renderDashboard(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "dashboard";

  const title = document.createElement("h2");
  title.textContent = "Dashboard";
  wrapper.append(title);

  renderDashboardControls({
    wrapper,
    onRefresh: () => renderDashboard(container)
  });

  container.append(wrapper);

  const state = loadState();
  const people = getPeopleWithoutUnassigned(state);
  const favorites = readJsonFromLocalStorage(FAVORITES_KEY, []);
  const activeFilter = localStorage.getItem(DASHBOARD_FILTER_KEY) || "Team";
  const dashboardsToShow = getDashboardsToShow({ activeFilter, people, favorites });
  const crmBoxContainers = [];

  dashboardsToShow.forEach(name => {
    const row = document.createElement("div");
    row.className = "dashboard-row";

    const taskBox = createTaskBox({
      name,
      state,
      favorites,
      onRefresh: () => renderDashboard(container)
    });

    const crmBoxContainer = createLoadingCrmBox({ name, state });

    row.append(taskBox, crmBoxContainer);
    wrapper.append(row);

    crmBoxContainers.push({ name, container: crmBoxContainer });
  });

  import("../../utils/contactsDb.js").then(async ({ getAllContacts, initContactsDB }) => {
    try {
      await initContactsDB();
      const allContacts = await getAllContacts();

      crmBoxContainers.forEach(({ name, container }) => {
        const crmBox = createCRMBox({ name, allContacts, state });
        container.replaceWith(crmBox);
      });
    } catch (error) {
      console.error("Failed to load contacts for dashboard", error);
      crmBoxContainers.forEach(({ container }) => {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:red">Kunde inte ladda CRM-data.</div>`;
      });
    }
  }).catch(error => {
    console.error("Failed to import contactsDb.js for dashboard", error);
  });
}