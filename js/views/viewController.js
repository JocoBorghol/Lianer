import { renderCalendar } from "./calendarView.js";
import { taskScreen } from "../taskList/taskScreen.js";
import { renderSettings } from "./settingsView.js"; 
import { renderContacts } from "./contactsView.js";
import { renderDashboard } from "./dashboard/dashboardView.js";

export class ViewController {
  constructor(target, services = {}) {
    this.container = target;

    /*
      services is now our small composition object.

      legacyTaskService:
        old LocalStorage/demo task service.
        Kept alive for old dialogs, welcome overlay, settings, etc.

      taskScreenViewModel:
        new API-backed ViewModel for taskScreen.
    */
    this.services = services;

    /*
      Compatibility alias.

      Some old views still expect "this.service" to be the old task service.
      So we keep this.service pointing to the legacy task service.
    */
    this.service = services.legacyTaskService ?? services.taskService ?? null;

    this.activeView = "dashboard";
    this.params = null;

    this.currentDate = new Date(); 
  }

  stepDate(days) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.render();
  }

  setView(view, params = null) {
    this.activeView = view;
    this.params = params;
    this.render();
  }

  navigate(view, params = null) {
    this.setView(view, params);
  }

  rerender() {
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = "";

    if (this.activeView === "dashboard") {
      renderDashboard(this.container);
      return;
    }

    if (this.activeView === "calendar") {
      renderCalendar(this.container, {
        calendarViewModel: this.services.calendarViewModel
      });
      return;
    }

    if (this.activeView === "tasks") {
      this.container.append(
        taskScreen({
          taskViewModel: this.services.taskScreenViewModel,

          /*
            Fallback/legacy taskService.
            Not the main source of truth for the task screen anymore,
            but useful while old dialogs still exist.
          */
          taskService: this.service,

          currentDate: this.currentDate,
          onNavigateDate: (days) => this.stepDate(days),
          navigate: (view, params) => this.setView(view, params)
        })
      );
      return;
    }

    if (this.activeView === "settings") {
      renderSettings(this.container, () => this.rerender(), this.service);
      return;
    }

    if (this.activeView === "contacts") {
      renderContacts(this.container, this.params);
      this.params = null;
      return;
    }
  }
}