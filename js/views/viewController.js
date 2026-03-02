import { renderCalendar } from "./calendarView.js";
import { taskScreen } from "../taskList/taskScreen.js";
import { renderSettings } from "./settingsView.js"; 
import { renderContacts } from "./contactsView.js";
import { renderDashboard } from "./dashboardView.js";

export class ViewController {
  constructor(target, service) {
    this.container = target;
    this.service = service;
    this.activeView = "dashboard";
    this.params = null; 
    // Nytt: Håll koll på navigationsdatumet för Vecko- och Dagsvy
    this.currentDate = new Date(); 
  }

  // Ny metod: Hanterar bläddring mellan dagar/veckor
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

    // Rensa containern helt innan ny rendering
    this.container.innerHTML = "";

    if (this.activeView === "dashboard") {
      renderDashboard(this.container);
      return;
    }

    if (this.activeView === "calendar") {
      renderCalendar(this.container);
      return;
    }

    if (this.activeView === "tasks") {
      this.container.append(
        taskScreen({
          taskService: this.service,
          // Skicka med currentDate så att Vecka/Dag-vyn vet vad den ska visa
          currentDate: this.currentDate, 
          // Skicka med stepDate så att knapparna i Task-headern kan anropa den
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