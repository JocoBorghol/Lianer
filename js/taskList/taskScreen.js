import { loadState } from "../storage.js";
import { TASK_STATUSES } from "../status.js";
import { openTaskDialog } from "../menu/openTaskDialog.js";
import { taskList } from "../taskList/taskList.js";
import { startOfWeekMonday, getWeekNumber } from "./dateHelpers.js";
import { renderWeekView } from "./weekView.js";
import { renderDayView } from "./dayView.js";
import { createTaskFilterHeader } from "./taskFilterHeader.js";
import { renderEmptyState } from "./emptyState.js";
import { renderTaskBoard } from "./taskBoard.js";


/**
 * @file taskScreen.js
 * @description Hanterar huvudskärmen för uppgifter (Kanban-vyn).
 */

 export const taskScreen = ({taskService, navigate, currentDate, onNavigateDate})=>
 {
      // TODO: eröstt med viewmodel och api
      const state = loadState();
      const people = state.people || [];


      let currentFilter = localStorage.getItem("taskViewFilter") || "Team";
      let currentViewMode = localStorage.getItem("taskViewMode") || "board";


      /**
       * Main wrapper
       */
      const screenWrapper = document.createElement("main");
      screenWrapper.classList.add("taskScreenWrapper");
      screenWrapper.setAttribute("aria-label", "Projekttavla");
      const contentArea = document.createElement("div");
      contentArea.classList.add("taskContentArea");

      /**
       * Header on taskboards
       * Holds controls for filtering etc
       */
      const toolbar = createTaskFilterHeader({
          people,
          currentFilter,
          currentViewMode,
          onNavigateDate,
          onFilterChange: (selectedFilter) => {
            currentFilter = selectedFilter;
            localStorage.setItem("taskViewFilter", currentFilter);
            updateView(currentFilter);
          },
          onViewModeChange: (viewMode) => {
            currentViewMode = viewMode;
            localStorage.setItem("taskViewMode", viewMode);
            updateView(currentFilter);
          }
      });

      /**
       * Logic to update board based on week/day etc
       */

      const updateNavigationLabel = () => {
          if (currentViewMode === "week") {
            const mon = startOfWeekMonday(currentDate);
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
            toolbar.dateLabel.textContent = `V. ${getWeekNumber(currentDate)} (${mon.getDate()}/${mon.getMonth()+1} - ${sun.getDate()}/${sun.getMonth()+1})`;
            toolbar.navContainer.style.display = "flex";
          } else if (currentViewMode === "day") {
            toolbar.dateLabel.textContent = currentDate.toLocaleDateString("sv-SE", { day: "numeric", month: "long" });
            toolbar.navContainer.style.display = "flex";
          } else {
            toolbar.navContainer.style.display = "none";
          }
      };
      
      const updateView = (selectedFilter) => {
          contentArea.innerHTML = "";
      
          const tasks = taskService.getTasks();
      
          // Uppdatera datumlabeln i nav-strippen
          updateNavigationLabel();
      
          if (tasks.length === 0 && selectedFilter !== "Arkiv") {
            toolbar.filterHeader.style.display = "none";
            renderEmptyState(contentArea, taskService);
            return;
          }
      
          toolbar.filterHeader.style.display = "";
      
          // ── Week View ──
          if (currentViewMode === "week" && selectedFilter !== "Arkiv") {
            const filteredTasks = selectedFilter === "Team"
              ? tasks
              : tasks.filter(t => t.assignedTo?.includes(selectedFilter) || t.assigned === selectedFilter);
            contentArea.append(renderWeekView(filteredTasks, currentDate, taskService));
            return;
          }
      
          // ── Day View ──
          if (currentViewMode === "day" && selectedFilter !== "Arkiv") {
            const filteredTasks = selectedFilter === "Team"
              ? tasks
              : tasks.filter(t => t.assignedTo?.includes(selectedFilter) || t.assigned === selectedFilter);
            contentArea.append(renderDayView(filteredTasks, currentDate, taskService));
            return;
          }
      
          contentArea.append(renderTaskBoard({
            tasks,
            selectedFilter,
            taskService,
            navigate,
            taskList,
            openTaskDialog,
            TASK_STATUSES
          }));
        };
      
        updateView(currentFilter);
      
        screenWrapper.append(toolbar.filterHeader, contentArea);
      
        return screenWrapper;
 }


 /*
  * 
Implementeringstankar: 

taskScreen vet mest om hur sitt UI ska se ut, och
kontrollerna / logiken på UI. 
skapa en ViewModel(ish) klass som håller en Map (snapshot)
av den data som ska visas. 
VM är source of truth till UI. Service till VM. 
Så om ändring sker i UI (t.ex status blir done), så 
skickar VM vidare ned till api , skickar ut uppdaterad snapshot. 
Optimera här så  vi intd behöcer hämta en HEL lista igen. 
Kanske en listra i backend för att hämta grupper av data medc barea id ? 

I de flesta fall ska listan i UI vara derivierad från snapshot listan i VM 
  * 
  */