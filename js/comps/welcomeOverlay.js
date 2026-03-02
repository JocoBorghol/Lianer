import { addTaskDialog } from "./dialog.js";
import { loadDemoByKey } from "../taskList/seed.js";

const STORAGE_KEY = "lianer_hasSeenWelcome";

const GH_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;
const LI_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

const CREATORS = [
  { name: "Alexander Jansson", github: "https://github.com/AlexanderJson",   linkedin: "https://www.linkedin.com/in/alexander-jansson" },
  { name: "Hussein Al-Hasnawy",   github: "https://github.com/exikoz",          linkedin: "https://www.linkedin.com/in/hussein-hasnawy-5280bb181/" },
  { name: "Joco Borghol",      github: "https://github.com/jocoborghol",     linkedin: "https://www.linkedin.com/in/joco-borghol-777b59386/" },
];

/**
 * Exports the HTML skeleton for the welcome view so that taskScreen can reuse it as an empty state.
 */
export function getWelcomeHTML(isOverlay = true) {
  return `
    <div class="welcome-bubble" role="document" ${!isOverlay ? 'style="border:none; background:transparent; max-height:none;"' : ''}>
      ${isOverlay ? `
      <div class="welcome-exit-group">
        <button class="welcome-close-temp" aria-label="Stäng välkomstskärmen tillfälligt" title="Stäng tillfälligt">✕</button>
      </div>` : ''}

      <div class="welcome-hero">
        <img src="./docs/images/demo/Slide11.jpg" alt="Lianer – A modern project planner" class="welcome-hero-img" />
        <div class="welcome-hero-overlay"></div>
      </div>

      <div class="welcome-content">
        <p class="welcome-body">
          Din arbetsyta är redo, men just nu ekar det tomt. En blank tavla är dock början på något stort!
          Här visualiserar ni teamets process från idé till färdig leverans. Ta kontroll över arbetsflödet,
          slipp bruset och samla hela teamets prioriteringar på en och samma plats.
        </p>

        <!-- Action cards -->
        <div class="welcome-actions">
          <div class="welcome-action-card welcome-card-create" role="button" tabindex="0" aria-label="Skapa er första uppgift">
            <span class="welcome-action-icon shadow-glow-blue">⊕</span>
            <div class="welcome-card-text">
              <strong>Börja här: Skapa er första uppgift</strong>
              <p>Sätt bollen i rullning genom att lägga till en uppgift med titel, beskrivning och ansvariga.</p>
            </div>
          </div>
          <div class="welcome-action-card welcome-card-demo" role="button" tabindex="0" aria-label="Utforska navigera till inställningar">
            <span class="welcome-action-icon shadow-glow-yellow">⚙</span>
            <div class="welcome-card-text">
              <strong>Utforska potentialen</strong>
              <p>Tryck här för att gå till <strong>Inställningar</strong> där du kan hantera appen eller utforska systemåtgärder.</p>
            </div>
          </div>
        </div>

        <!-- Quick-Start pills -->
        <div class="welcome-quickstart">
          <p class="welcome-qs-label">För att utforska demolägen så finns det en del olika varianter, kika på någon som passar dig bäst!</p>
          <div class="welcome-qs-pills">
            <button class="welcome-qs-pill qs-lia" data-demo="lia">🎓 LIA-Chase</button>
            <button class="welcome-qs-pill qs-tech" data-demo="tech">💻 Tech &amp; Dev</button>
            <button class="welcome-qs-pill qs-wedding" data-demo="wedding">💍 Bröllopsplanering</button>
            <button class="welcome-qs-pill qs-tele" data-demo="telemarketing">📞 Telemarketing</button>
            <button class="welcome-qs-pill qs-family" data-demo="family">🏠 Familjepusslet</button>
            <button class="welcome-qs-pill qs-event" data-demo="event">🎪 Eventkoordinator</button>
            <button class="welcome-qs-pill qs-realestate" data-demo="realestate">🏡 Fastighetsmäklare</button>
          </div>
        </div>

        ${isOverlay ? `
        <div class="welcome-permanence-action">
          <button class="welcome-close-perm">Visa inte denna skärm igen vid uppstart</button>
        </div>` : ''}

        <div class="welcome-creators">
          <h3 class="welcome-creators-title">Meet the Creators</h3>
          <div class="welcome-creators-grid">
            ${CREATORS.map(c => `
              <div class="welcome-creator-card">
                <a href="${c.github}" target="_blank" rel="noopener noreferrer" class="welcome-creator-name">${c.name}</a>
                <div class="welcome-creator-links">
                  <a href="${c.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="welcome-creator-link">${GH_SVG}</a>
                  <a href="${c.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="welcome-creator-link linkedin">${LI_SVG}</a>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}
/**
 * Attaches the shared event listeners for action cards and demo pills.
 */
export function attachWelcomeEvents(container, taskService, closeAction = null) {
  // Create card → open add task dialog
  container.querySelector(".welcome-card-create")?.addEventListener("click", () => {
    if (closeAction) closeAction();
    setTimeout(() => addTaskDialog(taskService), 350);
  });
  container.querySelector(".welcome-card-create")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { 
        e.preventDefault(); 
        if (closeAction) closeAction(); 
        setTimeout(() => addTaskDialog(taskService), 350); 
    }
  });

  // Demo card → Settings
  container.querySelector(".welcome-card-demo")?.addEventListener("click", () => {
    if (closeAction) closeAction();
    setTimeout(() => window.dispatchEvent(new CustomEvent("navigateTo", { detail: "settings" })), 350);
  });
  container.querySelector(".welcome-card-demo")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { 
        e.preventDefault(); 
        if (closeAction) closeAction(); 
        setTimeout(() => window.dispatchEvent(new CustomEvent("navigateTo", { detail: "settings" })), 350); 
    }
  });

  // Quick-Start pills → load demo, navigate to tasks
  container.querySelectorAll(".welcome-qs-pill").forEach(pill => {
    pill.addEventListener("click", async () => {
      const key = pill.dataset.demo;
      await loadDemoByKey(key, taskService);
      if (closeAction) closeAction();
      setTimeout(() => window.dispatchEvent(new CustomEvent("navigateTo", { detail: "tasks" })), 350);
    });
  });
}

/**
 * Shows the first-time welcome overlay.
 * Only renders when localStorage flag "lianer_hasSeenWelcome" is absent.
 */
export function maybeShowWelcomeOverlay(taskService) {
  if (localStorage.getItem(STORAGE_KEY)) return;

  const overlay = document.createElement("div");
  overlay.className = "welcome-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Välkommen till Lianer");

  overlay.innerHTML = getWelcomeHTML(true);

  document.body.appendChild(overlay);

  // Prevent body scroll while overlay visible
  document.body.style.overflow = "hidden";

  const animateClose = () => {
    overlay.classList.add("welcome-overlay--closing");
    overlay.addEventListener("animationend", () => {
      overlay.remove();
      document.body.style.overflow = "";
    }, { once: true });
  };

  /** Temporary close */
  const closeTemp = () => animateClose();

  /** Permanent close */
  const closePerm = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    animateClose();
  };

  // ✕ button
  overlay.querySelector(".welcome-close-temp")?.addEventListener("click", closeTemp);

  // "Visa inte igen" button
  overlay.querySelector(".welcome-close-perm")?.addEventListener("click", closePerm);

  // Click on backdrop (outside bubble) = session close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeTemp();
  });

  // Escape key = session close
  const onEsc = (e) => {
    if (e.key === "Escape") { 
      closeTemp(); 
      document.removeEventListener("keydown", onEsc); 
    }
  };
  document.addEventListener("keydown", onEsc);

  // Pass closeTemp to action cards so it doesn't forcibly perm-hide overlay if they didn't ask it to
  attachWelcomeEvents(overlay, taskService, closeTemp);
}
