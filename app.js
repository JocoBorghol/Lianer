import { menu } from "./js/menu/sideMenu.js";
import { subscribe } from "./js/observer.js";
import { initTheme } from "./js/theme.js";
import { openTaskDialog } from "./js/menu/openTaskDialog.js";
import { maybeShowWelcomeOverlay } from "./js/comps/welcomeOverlay.js";

import { initSeed } from "./js/taskList/seed.js";
import { TaskRepo } from "./js/repo/taskRepo.js";
import { TaskService } from "./js/service/taskService.js";
import { ViewController } from "./js/views/viewController.js";

 /**
 * @file app.js
 * @description Huvudentrépunkt för Lianer Project Management App.
 * Hanterar initiering av tema, layoutstruktur och globala händelselyssnare.
 */

// Initiera tema (Mörkt/Ljust)
initTheme();


// Initirar våra instanser
const taskRepo = new TaskRepo();
const taskService = new TaskService(taskRepo);
taskService.init();


/** @type {HTMLElement} - Huvudcontainern definierad i index.html */
const app = document.getElementById("app");
app.classList.add("app");

/** * Sidomeny (Navigation)
 * @description Använder <aside> och role="navigation" för att markera sektionen som sekundärt innehåll/navigering.
 * @type {HTMLElement}
 */
const sideMenuDiv = document.createElement("aside");
sideMenuDiv.classList.add("left");
sideMenuDiv.setAttribute("role", "navigation");
sideMenuDiv.setAttribute("aria-label", "Huvudmeny");


/** * Huvudinnehåll (Main)
 * @description Använder <main> för att markera applikationens centrala innehåll, vilket är kritiskt för tillgänglighet.
 * @type {HTMLElement}
 */
const mainContent = document.createElement("main");
mainContent.classList.add("center");
mainContent.setAttribute("id", "main-content");

/**
 * Initiera vyn-hanteraren och koppla den till huvudytan.
 */
const viewController = new ViewController(mainContent,taskService);
const sideMenu = menu({
  navigate:(view,params) => viewController.setView(view, params),
  onAddTask: () => openTaskDialog({taskService})
});
sideMenuDiv.append(sideMenu);


/**
 * Initiera startdata och sätt startvyn till dashboard.
 * IMPORTANT: subscribe() must come AFTER initSeed + setView to avoid
 * double-render. initSeed→saveState→notify would trigger rerenderActiveView
 * before setView runs, rendering the dashboard twice.
 */
initSeed();

// Bygg ihop applikationens grundstruktur atomiskt
app.replaceChildren(sideMenuDiv, mainContent);

viewController.setView("dashboard");

// Register observer AFTER initial render to prevent double-render
subscribe(() => viewController.rerender());

// Show first-time welcome overlay (checks localStorage internally)
maybeShowWelcomeOverlay(taskService);

// Handle navigation events dispatched by overlay quick-start pills
window.addEventListener("navigateTo", (e) => {
  const view = e.detail;
  if (view) viewController.setView(view);
});

/**
 * Global händelselyssnare för interaktioner.
 * Hanterar bland annat öppning av dialogrutan för att lägga till nya uppgifter (FAB).
 * * @param {MouseEvent} e - Klickhändelsen.
 */
document.addEventListener("click", (e) => {
  /** @type {Element|null} - Hittar närmaste element med klassen .addTaskFab */
  const fabButton = e.target.closest(".addTaskFab");
  if (fabButton) {
    openTaskDialog({taskService});
  }
});

/**
 * Service Worker och Background Sync registrering.
 * Hanterar Offline-stöd och datasynkronisering i bakgrunden.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      /** @type {ServiceWorkerRegistration} */
      const registration = await navigator.serviceWorker.register("/K3---Projekt-i-team/service-worker.js");
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

window.addEventListener('beforeinstallprompt', (e) => {
  // Förhindra att webbläsaren visar sin standardprompt
  e.preventDefault();
  // Spara eventet så att det kan triggas senare via en egen knapp.
  window.deferredPrompt = e;
  deferredPrompt = e;

  // Visa endast om användaren inte redan har klickat "Senare"
  if (localStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return;
  }

  // Skapa en installationsbanner om den inte redan finns
  if (!document.getElementById('pwa-install-banner')) {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
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

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      // Göm bannern
      banner.style.display = 'none';
      // Visa webbläsarens installationsprompt
      deferredPrompt.prompt();
      // Vänta på användarens val
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Lianer: Användaren valde att ${outcome === 'accepted' ? 'installera' : 'avvisa'} PWA.`);
      deferredPrompt = null;
      window.deferredPrompt = null;
    });

    document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
      // Spara i LocalStorage att användaren avvisat prompten
      localStorage.setItem('pwa-prompt-dismissed', 'true');
      // Göm bannern om användaren klickar "Senare"
      banner.style.display = 'none';
    });
  }
});

window.addEventListener('appinstalled', () => {
  // Rensa deferredPrompt och göm eventuell banner
  deferredPrompt = null;
  window.deferredPrompt = null;
  console.log('Lianer: PWA installerades framgångsrikt');
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.display = 'none';
  }
});