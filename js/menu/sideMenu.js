import { Btn } from "../comps/btn.js";
import { toggleThemeBtn } from "../comps/themeBtn.js";
import { loadState, saveState } from "../storage.js";
import { subscribe } from "../observer.js";

export const menu = ({navigate, onAddTask}) => {
  const div = document.createElement("div");
  div.classList.add("menu");

  // Skapa input-elementet EN GÅNG utanför update-funktionen för att inte tappa referensen
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const base64 = readerEvent.target.result;
            

            const newState = loadState();
            if (!newState.settings) newState.settings = {};
            newState.settings.teamImage = base64;
            
            saveState(newState);
        };
        reader.readAsDataURL(file);
    }
    e.target.value = ""; 
  };
  
  div.append(fileInput);

  const updateBrandName = (brandElement) => {
    const state = loadState();
    const teamName = state.settings?.teamName || "Mitt Team";
    const teamImage = state.settings?.teamImage || null;

    brandElement.innerHTML = "";


    const textNode = document.createElement("span");
    textNode.className = "nav-text";
    textNode.textContent = teamName.toUpperCase();
    brandElement.appendChild(textNode);


    const imgContainer = document.createElement("div");
    imgContainer.className = "team-logo-container";
    imgContainer.title = "Klicka för att byta bild";
    

    const img = document.createElement("img");
    img.className = "team-logo";
    img.src = teamImage ? teamImage : "./icons/icon-192.png"; 
    img.alt = "Team Logo";
    

    imgContainer.onclick = () => fileInput.click();

    imgContainer.appendChild(img);
    brandElement.appendChild(imgContainer);
  };

  // ... (rest of file) ... 



  const toggleBtn = document.createElement("button");
  toggleBtn.className = "menu-toggle-btn";
  toggleBtn.innerHTML = `<span class="material-symbols-rounded">keyboard_double_arrow_left</span>`; 
  toggleBtn.onclick = () => {
    const isCollapsed = div.classList.toggle("collapsed");

    toggleBtn.innerHTML = `<span class="material-symbols-rounded">${isCollapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}</span>`;
    document.body.classList.toggle("menu-is-collapsed", isCollapsed);
  };
  div.append(toggleBtn);

  const brand = document.createElement("div");
  brand.classList.add("menu-brand");

  brand.style.flexDirection = "column"; 
  brand.style.gap = "15px";

  updateBrandName(brand); 
  div.append(brand);

  subscribe(() => {
    updateBrandName(brand);
  });

  const mainButtons = document.createElement("div");
  mainButtons.classList.add("menu-main");

  const mainMenuButtons = [
    { text: "Kalender",     icon: "calendar_month", view: "calendar" }, 
    { text: "Dashboard",    icon: "dashboard",      view: "dashboard" },
    { text: "Uppgifter",    icon: "assignment",     view: "tasks" },
    { text: "Kontakter",    icon: "group",          view: "contacts" },
    { text: "Inställningar", icon: "settings",       view: "settings" },
    { text: "Tema",         icon: "contrast",       view: "theme" } 
  ];

  mainMenuButtons.forEach((b, index) => {
    const btnElement = Btn({
      text: `<span class="nav-icon material-symbols-rounded">${b.icon}</span> <span class="nav-text">${b.text}</span>`, 
      className: `menu-btn ${b.view === "settings" ? "settings-link" : ""}`,
      onClick: () => {
        if (b.view === "theme") {
          const actualBtn = toggleThemeBtn();
          actualBtn.click();
        } else {
          navigate?.(b.view);
        }
      }
    });

    mainButtons.append(btnElement);

    if (index === 2) {
      const addBtn = Btn({
        text: `<span class="nav-icon material-symbols-rounded">add_circle</span><span class="nav-text">Lägg till uppgift</span>`,
        className: "menu-btn addTaskFab",
        onClick: () => onAddTask?.()
      });
      mainButtons.append(addBtn);
    }
  });

  const footerSection = document.createElement("div");
  footerSection.className = "menu-footer";
  footerSection.style.marginTop = "auto"; 

  div.append(mainButtons, footerSection);

  return div;
};