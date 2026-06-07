import { listItem } from "./listItem.js";
/**
 * @file taskList.js
 * @description Renderar en enskild kolumn (statusgrupp) i Kanban-tavlan.
 * Hanterar expandering/kollaps med persistens och tillgänglighetsstöd.
 */

// Helper: Hitta vilket element man drar uppgiften över
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.listItem:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Skapar en uppgiftslista för en specifik status.
 * @param {string} status - Namnet på statusen (t.ex. 'Todo', 'In Progress').
 * @param {Array<Object>} tasks - Lista över uppgifter som tillhör denna status.
 * @returns {HTMLElement} Kolumnelementet.
 */
export const taskList = (status, tasks, deps = {}) => {
  const container = document.createElement("div");
  const actions = createListActions(deps);

  // Hämta sparat läge för att bibehålla användarens vy vid omladdning
  const storageKey = `column_state_${status}`;
  const savedState = localStorage.getItem(storageKey);
  const isInitiallyExpanded = savedState !== "collapsed";

  // AUTO-EXPAND LOGIC: Öppnar kolumnen automatiskt om den går från 0 till 1+ uppgifter
  const countKey = `column_count_${status}`;
  const lastCount = parseInt(localStorage.getItem(countKey) || "0");
  const currentCount = tasks.length;

  let shouldBeExpanded = isInitiallyExpanded;

  if (lastCount === 0 && currentCount > 0) {
    shouldBeExpanded = true;
    localStorage.setItem(storageKey, "expanded");
  }

  localStorage.setItem(countKey, currentCount);

  // Klasshantering för CSS och styling
  const baseClass = "task-column";
  const archiveClass = status === "Stängd" ? " closed-tasks-archive" : "";
  const collapsedClass = shouldBeExpanded ? "" : " collapsed";

  container.className = `${baseClass}${archiveClass}${collapsedClass}`;
  container.setAttribute("data-status", status);

  // ---------- TILLGÄNGLIG HEADER (VG: Semantisk Button) ----------
  const header = document.createElement("button");
  header.className = "taskHeader clickable-header";
  header.setAttribute("aria-expanded", String(shouldBeExpanded));
  header.setAttribute("aria-label", `${status}, ${tasks.length} uppgifter. Klicka för att expandera eller dölja.`);

  const initialRotation = shouldBeExpanded ? "0deg" : "-90deg";

  header.innerHTML = `
    <div class="header-content" aria-hidden="true">
      <span class="arrow-wrapper">
        <span class="taskArrow" style="transform: rotate(${initialRotation}); display: inline-block; transition: transform 0.3s ease;">▼</span>
      </span>
      <span class="status-text">${status === "Stängd" ? "STÄNGD" : status.toUpperCase()}</span>
    </div>
    <span class="taskCount" aria-hidden="true">${tasks.length}</span>
  `;

  // Container för listobjekt
  const listItemsContainer = document.createElement("div");
  listItemsContainer.className = "task-list-items";
  listItemsContainer.setAttribute("role", "list");
  listItemsContainer.style.display = shouldBeExpanded ? "flex" : "none";
  listItemsContainer.style.flexDirection = "column";
  listItemsContainer.style.gap = "16px";
  // Behövs för att göra det the dropzone
  listItemsContainer.style.minHeight = "50px";

  // Arkiv-beskrivning (VG: Inkluderande beskrivning)
  if (status === "Stängd") {
    const description = document.createElement("p");
    description.className = "archive-description";
    description.textContent = "Här sparas uppgifter som inte längre är aktuella eller har arkiverats.";
    description.style.display = shouldBeExpanded ? "block" : "none";
    container.append(header, description, listItemsContainer);
  } else {
    container.append(header, listItemsContainer);
  }

  /**
   * Hanterar klick på headern för att toggla kolumnens synlighet.
   * Uppdaterar ARIA-tillstånd och lokal lagring (VG: Focus Management).
   */
  header.onclick = () => {
    const isCollapsed = container.classList.toggle("collapsed");
    const isExpanded = !isCollapsed;

    // Spara läge och uppdatera tillgänglighetsattribut
    localStorage.setItem(storageKey, isExpanded ? "expanded" : "collapsed");
    header.setAttribute("aria-expanded", String(isExpanded));

    const arrow = header.querySelector(".taskArrow");
    if (arrow) {
      arrow.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0deg)";
    }

    listItemsContainer.style.display = isCollapsed ? "none" : "flex";

    const description = container.querySelector(".archive-description");
    if (description) {
      description.style.display = isCollapsed ? "none" : "block"; //101
    }
  };

  // Rendera innehåll (VG: Modulär användning av listItem)
  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "emptyState";
    empty.textContent = "Inga uppgifter";
    listItemsContainer.append(empty);
  } else {
    tasks.forEach(task => {
      // Skickar vidare uppgiften till listItem som nu hanterar flera avatarer
      listItemsContainer.append(listItem(task, actions));
    });
  }

  // --- HTML5 DRAG AND DROP EVENTS ---
  listItemsContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    listItemsContainer.classList.add("drag-over");
    
    // Ta bort "Inga uppgifter" om vi drar över det
    const emptyState = listItemsContainer.querySelector(".emptyState");
    if (emptyState) emptyState.remove();

    const afterElement = getDragAfterElement(listItemsContainer, e.clientY);
    const draggingElement = document.querySelector(".dragging");
    if (draggingElement) {
      if (afterElement == null) {
        listItemsContainer.appendChild(draggingElement);
      } else {
        listItemsContainer.insertBefore(draggingElement, afterElement);
      }
    }
  });

  listItemsContainer.addEventListener("dragleave", (e) => {
    // Only remove drag-over class if leaving the actual container (not entering a child card)
    if (!listItemsContainer.contains(e.relatedTarget)) {
      listItemsContainer.classList.remove("drag-over");
    }
  });

  listItemsContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    listItemsContainer.classList.remove("drag-over");
    
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    // Hitta var kortet släpptes
    const afterElement = getDragAfterElement(listItemsContainer, e.clientY);
    const nextTaskId = afterElement ? afterElement.getAttribute("data-task-id") : null;
    
    let prevTaskId = null;
    if (afterElement) {
        const prevElement = afterElement.previousElementSibling;
        if (prevElement && prevElement.hasAttribute('data-task-id') && !prevElement.classList.contains("dragging")) {
            prevTaskId = prevElement.getAttribute("data-task-id");
        }
    } else {
        const allItems = [...listItemsContainer.querySelectorAll('.listItem:not(.dragging)')];
        if (allItems.length > 0) {
            prevTaskId = allItems[allItems.length - 1].getAttribute("data-task-id");
        }
    }

    if (deps.onDropTask) {
        deps.onDropTask(taskId, status, prevTaskId, nextTaskId);
    }
  });

  return container;
};

const createListActions = (deps) => ({
  onNavigate: deps.navigate,
  onEditTask: (task) => deps.onEditTask?.(task),
  onMoveTask: (id, direction) => deps.onMoveTask?.(id, direction),
  onChangeStatus: (id, newStatus) => deps.onChangeStatus?.(id, newStatus),
  onDeleteTask: (task) => deps.onDeleteTask?.(task),
});
