function dispatchRenderApp() {
  window.dispatchEvent(new CustomEvent('renderApp'));
}

function getFilteredTasks(tasks, selectedFilter) {
  if (selectedFilter === "Team") {
    return tasks;
  }

  return tasks.filter(t => {
    if (t.assignedTo && Array.isArray(t.assignedTo)) {
      if (selectedFilter === "Ingen") {
        return t.assignedTo.length === 0 || t.assignedTo.includes("Ingen");
      }
      return t.assignedTo.includes(selectedFilter);
    }
    return t.assigned === selectedFilter;
  });
}

function createArchiveBoard({ board, tasks, taskService, navigate, taskList, TASK_STATUSES }) {
  const archiveColumn = document.createElement("section");
  archiveColumn.className = "taskWrapper closed-tasks-archive";
  archiveColumn.setAttribute("aria-label", "Stängda uppgifter");
  archiveColumn.setAttribute("data-status", "Stängd");

  const closedTasks = tasks.filter(t => t.status === TASK_STATUSES.CLOSED);
  archiveColumn.append(taskList(TASK_STATUSES.CLOSED, closedTasks, {
    taskService,
    navigate,
    onDropTask: (taskId, newStatus, prevOrderId, nextOrderId) => {
      if (taskService.updateTaskOrder) {
        taskService.updateTaskOrder(taskId, newStatus, prevOrderId, nextOrderId);
        dispatchRenderApp();
      }
    }
  }));
  board.append(archiveColumn);
}

function createActiveBoard({ board, tasks, selectedFilter, taskService, navigate, taskList, openTaskDialog, TASK_STATUSES }) {
  const filteredTasks = getFilteredTasks(tasks, selectedFilter);

  const activeStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.DONE];

  activeStatuses.forEach(status => {
    const columnWrapper = document.createElement("section");
    columnWrapper.classList.add("taskWrapper");
    columnWrapper.setAttribute("data-status", status); // VIKTIGT för glow
    columnWrapper.setAttribute("aria-label", `Kolumn: ${status}`);

    const columnTasks = filteredTasks
      .filter(t => t.status === status)
      .sort((a, b) => taskService._compareRank(a.order || "", b.order || ""));

    columnWrapper.append(taskList(status, columnTasks, {
      taskService,
      navigate,
      onMoveTask:  async (id,dir) => {
        await taskService.moveTask(id,dir);
        dispatchRenderApp();
      },
      onChangeStatus: async (id, newStatus) => {
        await taskService.changeStatus(id, newStatus);
        dispatchRenderApp();
      },

      onDeleteTask: async (task) => {
        await taskService.deleteTask(task.id);
        dispatchRenderApp();
      },
      onEditTask: (task) => openTaskDialog({ taskService, taskToEdit: task }),
      onDropTask: (taskId, newStatus, prevOrderId, nextOrderId) => {
        if (taskService.updateTaskOrder) {
          taskService.updateTaskOrder(taskId, newStatus, prevOrderId, nextOrderId);
          dispatchRenderApp();
        }
      }
    }));
    board.append(columnWrapper);
  });
}

export function renderTaskBoard({ tasks, selectedFilter, taskService, navigate, taskList, openTaskDialog, TASK_STATUSES }) {
  const board = document.createElement("div");
  board.id = "task-board";
  board.classList.add("taskBoard");
  board.setAttribute("role", "region");
  board.setAttribute("aria-live", "polite");

  if (selectedFilter === "Arkiv") {
    createArchiveBoard({ board, tasks, taskService, navigate, taskList, TASK_STATUSES });
  } else {
    createActiveBoard({ board, tasks, selectedFilter, taskService, navigate, taskList, openTaskDialog, TASK_STATUSES });
  }

  return board;
}
