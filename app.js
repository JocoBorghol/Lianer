import { menu } from "./js/menu/sideMenu.js";
import { subscribe } from "./js/observer.js";
import { initTheme } from "./js/theme.js";
import { openTaskDialog } from "./js/menu/openTaskDialog.js";
import { maybeShowWelcomeOverlay } from "./js/comps/welcomeOverlay.js";
import { renderAuthView } from "./js/views/auth/authView.js";
import { TaskRepo } from "./js/repo/TaskRepo.js";
import { TaskService } from "./js/service/taskService.js";
import { ViewController } from "./js/views/viewController.js";
import { smokeTestCreateUser } from "./js/api/dev/userSmokeTest.js";
import { noteApi } from "./js/api/dev/Endpoints/noteApi.js";
import { NoteService } from "./js/api/dev/Service/NoteService.js";
import { ActivityStore } from "./js/api/dev/Service/ActivityStore.js";
import { ActivityService } from "./js/api/dev/Service/activityService.js";
import { TaskScreenViewModel } from "./js/taskList/TaskScreenViewModel.js";
import { activityApi } from "./js/api/dev/Endpoints/activityApi.js";
import { UserService } from "./js/api/dev/Service/UserService.js";
import { CalendarViewModel } from "./js/views/CalendarViewModel.js";
import { ContactStore } from "./js/views/ContactStore.js";
import { ContactService } from "./js/views/ContactService.js";
import { ContactViewModel } from "./js/views/ContactsViewModel.js";
import { contactApi } from "./js/api/dev/Endpoints/contactApi.js";
import { DashboardViewModel } from "./js/views/dashboard/DashboardViewModel.js";
import { leadApi } from "./js/api/dev/Endpoints/leadApi.js";

import { LeadStore } from "./js/api/dev/Service/LeadStore.js";
import { LeadService } from "./js/api/dev/Service/LeadService.js";
/**
 * @file app.js
 * @description Huvudentrépunkt för Lianer Project Management App.
 * Hanterar initiering av tema, layoutstruktur och globala händelselyssnare.
 */

// Initiera tema (Mörkt/Ljust)
initTheme();

/** @type {HTMLElement} - Huvudcontainern definierad i index.html */
const app = document.getElementById("app");

let appHasStarted = false;

window.lianerSmokeTests = Object.freeze({
  smokeTestCreateUser
});

 
showAuthScreen();

window.addEventListener("authFormSubmitted", (event) => {
  console.log("Auth form submitted:", event.detail);

 
  startApplicationShell();
});

function showAuthScreen() {
  app.className = "";
  app.replaceChildren(renderAuthView());
}

function startApplicationShell() {
  if (appHasStarted) {
    return;
  }

  appHasStarted = true;

  app.classList.add("app");

  /*
    Legacy - TODO - kommer byta ut detta snart
  */
  const taskRepo = new TaskRepo();
  const legacyTaskService = new TaskService(taskRepo);
  legacyTaskService.init();
 
  const activityStore = new ActivityStore();

  const activityService = new ActivityService({
    activityApi,
    activityStore
  });
  const noteService = new NoteService(noteApi);

  let userService = null;

  try {
    userService = new UserService();
  } catch (error) {
    console.warn("UserService could not be created Error:", error);
  }
  const contactStore = new ContactStore();

  const contactService = new ContactService({
    contactApi,
    contactStore
  });
  const leadStore = new LeadStore();

  const leadService = new LeadService({
    leadApi,
    leadStore
  });
  const contactViewModel = new ContactViewModel({
    contactService,
    userService,
    leadService
  });
  const taskScreenViewModel = new TaskScreenViewModel({
    activityService,
    userService,
    noteService
  });
  const dashboardViewModel = new DashboardViewModel({
    taskScreenViewModel,
    contactViewModel
  });
  const calendarViewModel = new CalendarViewModel({
    taskScreenViewModel
  });


  const activityTaskServiceAdapter = taskScreenViewModel.getTaskServiceAdapter();
 
  const appServices = {
    legacyTaskService,
    activityStore,
    activityService,
    noteService,
    contactStore,
    contactService,
    userService,
    taskScreenViewModel,
    calendarViewModel,
    contactViewModel,
    leadStore,
    leadService,
    dashboardViewModel
  };

  /**
   * Sidomeny (Navigation)
   */
  const sideMenuDiv = document.createElement("aside");
  sideMenuDiv.classList.add("left");
  sideMenuDiv.setAttribute("role", "navigation");
  sideMenuDiv.setAttribute("aria-label", "Huvudmeny");

  /**
   * Huvudinnehåll (Main)
   */
  const mainContent = document.createElement("main");
  mainContent.classList.add("center");
  mainContent.setAttribute("id", "main-content");

  /**
   * Initiera vyn-hanteraren och koppla den till huvudytan.
   */
  const viewController = new ViewController(mainContent, appServices);

  const sideMenu = menu({
    navigate: (view, params) => viewController.setView(view, params),
    onAddTask: () => openTaskDialog({ taskService: activityTaskServiceAdapter })
  });

  sideMenuDiv.append(sideMenu);

 
  app.replaceChildren(sideMenuDiv, mainContent);

  viewController.setView("dashboard");

  subscribe(() => viewController.rerender());

  window.addEventListener("renderApp", () => {
    viewController.rerender();
  });
  maybeShowWelcomeOverlay(legacyTaskService);

  window.addEventListener("navigateTo", (e) => {
    const view = e.detail;
    if (view) viewController.setView(view);
  });

  document.addEventListener("click", (e) => {
    const fabButton = e.target.closest(".addTaskFab");

  if (fabButton) {
    openTaskDialog({ taskService: activityTaskServiceAdapter });
  }
  });
}
/**
 * Service Worker och Background Sync registrering.
 * Hanterar Offline-stöd och datasynkronisering i bakgrunden.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      /** @type {ServiceWorkerRegistration} */
      const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "/Lianer/" });
      console.log("Service Worker registered");

      // Vänta tills service workern är aktiv
      await navigator.serviceWorker.ready;

      // Registrera Background Sync om det stöds av webbläsaren
      if ("sync" in registration) {
        try {
          await registration.sync.register("sync-data");
          console.log("Background Sync registered");
        } catch (err) {
          console.warn("Background Sync failed:", err);
        }
      }

    } catch (err) {
      console.warn("Service Worker registration failed:", err);
    }
  });
}

/**
 * Hantera PWA Installation (US-2.4)
 * Obs: Varningen "beforeinstallpromptevent.preventDefault() called" är förväntad
 * eftersom vi ersätter standardbeteendet med vår egen anpassade installationsbanner.
 */
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Förhindra att webbläsaren visar sin standardprompt
  e.preventDefault();

  // Spara eventet så att det kan triggas senare via en egen knapp.
  window.deferredPrompt = e;
  deferredPrompt = e;

  // Visa endast om användaren inte redan har klickat "Senare"
  if (localStorage.getItem("pwa-prompt-dismissed") === "true") {
    return;
  }

  // Skapa en installationsbanner om den inte redan finns
  if (!document.getElementById("pwa-install-banner")) {
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";

    // Inline styling för bannern
    banner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--bg-card, #fff); color: var(--text-main, #333); box-shadow: 0 -4px 15px rgba(0,0,0,0.15); position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; border-top: 1px solid var(--border, #eee); animation: slideUp 0.3s ease-out;">
        <style>
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        </style>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 15px;">Installera appen</strong>
          <span style="font-size: 13px; color: var(--text-dim, #666);">Få åtkomst från hemskärmen och offline-stöd</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="pwa-install-dismiss" style="background: none; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; color: var(--text-dim, #666); font-weight: 500; font-family: inherit;">Senare</button>
          <button id="pwa-install-btn" style="background: var(--accent-cyan, #0ea5e9); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: inherit; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);">Installera</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById("pwa-install-btn").addEventListener("click", async () => {
      // Göm bannern
      banner.style.display = "none";

      // Visa webbläsarens installationsprompt
      deferredPrompt.prompt();

      // Vänta på användarens val
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`Lianer: Användaren valde att ${outcome === "accepted" ? "installera" : "avvisa"} PWA.`);

      deferredPrompt = null;
      window.deferredPrompt = null;
    });

    document.getElementById("pwa-install-dismiss").addEventListener("click", () => {
      // Spara i LocalStorage att användaren avvisat prompten
      localStorage.setItem("pwa-prompt-dismissed", "true");

      // Göm bannern om användaren klickar "Senare"
      banner.style.display = "none";
    });
  }
});

window.addEventListener("appinstalled", () => {
  // Rensa deferredPrompt och göm eventuell banner
  deferredPrompt = null;
  window.deferredPrompt = null;

  console.log("Lianer: PWA installerades framgångsrikt");

  const banner = document.getElementById("pwa-install-banner");

  if (banner) {
    banner.style.display = "none";
  }
});