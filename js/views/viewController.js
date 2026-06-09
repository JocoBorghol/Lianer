import { renderCalendar } from "./calendarView.js";
import { taskScreen } from "../taskList/taskScreen.js";
import { renderSettings } from "./settingsView.js"; 
import { renderContacts } from "./contactsView.js";
import { renderDashboard } from "./dashboard/dashboardView.js";

export class ViewController {
  constructor(target, services = {}) {
    this.container = target;
 
    this.services = services;

    /*
      TODO: still some mixes with old state data that cant just be removed
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
      renderDashboard(this.container, {
        dashboardViewModel: this.services.dashboardViewModel
      });
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
      renderContacts(this.container, this.params, {
        contactViewModel: this.services.contactViewModel
      });

      this.params = null;
      return;
    }
  }
}