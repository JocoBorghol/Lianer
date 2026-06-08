import { CRM_DASHBOARD_STATUSES } from "./dashboardConstants.js";
import {
  createDashboardBoxHeader,
  createDashboardTotal,
  createWeeklyTargetGroup,
  getStartOfCurrentWeek,
  getTeamName
} from "./dashboardHelpers.js";
import { createStatusGroup } from "./createStatusGroup.js";

export function createCRMBox({ name, allContacts, state }) {
  const box = document.createElement("div");
  box.className = "dashboard-box";

  const teamName = getTeamName(state);
  const title = name === "Team"
    ? `${teamName} – CRM`
    : `${name} – CRM`;

  const { header } = createDashboardBoxHeader(title);
  box.append(header);

  const relevantContacts = name === "Team"
    ? allContacts
    : allContacts.filter(contact => contact.assignedTo === name);

  const activeContacts = relevantContacts.filter(contact => contact.status !== "Förlorad");
  const totalCount = activeContacts.length;

  box.append(createDashboardTotal(`Totalt: ${totalCount}`, {
    marginBottom: name === "Team" ? "0px" : undefined
  }));

  if (name === "Team") {
    const unassignedCount = relevantContacts.filter(contact =>
      !contact.assignedTo || contact.assignedTo === "Ingen"
    ).length;

    box.append(createDashboardTotal(
      `Lediga: <span style="color: var(--accent-cyan); font-weight: 700;">${unassignedCount}</span>`,
      { marginTop: "0px" }
    ));
  }

  appendCrmWeeklyTarget({ box, relevantContacts, state });
  appendCrmStatusGroups({ box, relevantContacts, totalCount });

  return box;
}

function appendCrmWeeklyTarget({ box, relevantContacts, state }) {
  const weeklyTarget = state.settings?.weeklyCRMTarget || 5;
  const startOfWeek = getStartOfCurrentWeek();

  const completedThisWeek = relevantContacts.filter(contact => {
    if (contact.status !== "Klar") return false;

    const doneDate = contact.completedAt || contact.lastContactDate;

    if (!doneDate) return true;

    return new Date(doneDate) >= startOfWeek;
  }).length;

  const targetPercent = Math.min(
    100,
    Math.round((completedThisWeek / weeklyTarget) * 100)
  );

  box.append(createWeeklyTargetGroup({
    label: "VECKOMÅL (CRM)",
    completed: completedThisWeek,
    target: weeklyTarget,
    percent: targetPercent
  }));
}

function appendCrmStatusGroups({ box, relevantContacts, totalCount }) {
  CRM_DASHBOARD_STATUSES.forEach(status => {
    const statusContacts = relevantContacts.filter(contact => contact.status === status.key);

    const percent = totalCount === 0
      ? 0
      : Math.round((statusContacts.length / totalCount) * 100);

    const items = statusContacts
      .slice(0, 10)
      .map(contact => contact.company
        ? `${contact.company} (${contact.name})`
        : contact.name
      );

    if (statusContacts.length > 10) {
      items.push(`...och ${statusContacts.length - 10} till`);
    }

    box.append(createStatusGroup({
      label: status.key,
      count: statusContacts.length,
      cssClass: status.css,
      percent,
      items
    }));
  });
}