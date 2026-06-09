import { getWelcomeHTML, attachWelcomeEvents } from "../comps/welcomeOverlay.js";

export function renderEmptyState(contentArea, taskService) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state-container";
  emptyState.setAttribute("role", "region");
  emptyState.setAttribute("aria-label", "Välkommen till Lianer");
  emptyState.innerHTML = getWelcomeHTML(false);
  attachWelcomeEvents(emptyState, taskService, null);
  contentArea.append(emptyState);
}
