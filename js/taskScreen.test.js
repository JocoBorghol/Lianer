import { jest } from "@jest/globals";

let taskScreen;
let mockTaskService;
let mockTaskViewModel;
let currentState;

const flushAllPromises = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe("taskScreen component", () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-18"));

    currentState = {
      people: ["Ingen", "Anna", "Björn"],
      tasks: [
        {
          id: 1,
          title: "T1",
          status: "Att göra",
          assigned: "Anna",
          assignedTo: ["Anna"]
        },
        {
          id: 2,
          title: "T2",
          status: "Pågår",
          assigned: "Björn",
          assignedTo: ["Björn"]
        },
        {
          id: 3,
          title: "T3",
          status: "Klar",
          assigned: "Ingen",
          assignedTo: ["Ingen"]
        },
        {
          id: 4,
          title: "T4",
          status: "Stängd",
          assigned: "Anna",
          assignedTo: ["Anna"]
        },
        {
          id: 5,
          title: "T5",
          status: "Att göra",
          assigned: "Björn"
        }
      ]
    };

    const mockStorage = {
      loadState: jest.fn(() => currentState),
      saveState: jest.fn()
    };

    mockTaskService = {
      getTasks: jest.fn(() => currentState.tasks),
      getPeople: jest.fn(() => currentState.people),
      _compareRank: jest.fn(() => 0),
      moveTask: jest.fn(),
      changeStatus: jest.fn(),
      deleteTask: jest.fn(),
      addTask: jest.fn(),
      updateTask: jest.fn()
    };

    mockTaskViewModel = {
      init: jest.fn().mockResolvedValue(),

      getState: jest.fn(() => ({
        isLoaded: true,
        isLoading: false,
        error: null
      })),

      getTaskServiceAdapter: jest.fn(() => mockTaskService),

      getTasks: jest.fn(() => mockTaskService.getTasks()),

      getPeople: jest.fn(() => currentState.people),

      getViewState: jest.fn(() => ({
        tasks: mockTaskService.getTasks(),
        people: currentState.people,
        error: null
      }))
    };

    const mockTaskList = {
      taskList: jest.fn((status, tasks) => {
        const div = document.createElement("div");
        div.className = "mock-task-list";
        div.setAttribute("data-status", status);
        div.textContent = `${status} - ${tasks.length} tasks`;
        return div;
      })
    };

    jest.unstable_mockModule("./storage.js", () => mockStorage);

    jest.unstable_mockModule("./taskList/taskList.js", () => mockTaskList);

    jest.unstable_mockModule("./menu/openTaskDialog.js", () => ({
      openTaskDialog: jest.fn()
    }));

    jest.unstable_mockModule("./status.js", () => ({
      TASK_STATUSES: {
        TODO: "Att göra",
        IN_PROGRESS: "Pågår",
        DONE: "Klar",
        CLOSED: "Stängd"
      }
    }));

    const module = await import("./taskList/taskScreen.js");
    taskScreen = module.taskScreen;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function renderTaskScreen(overrides = {}) {
    const element = taskScreen({
      taskViewModel: mockTaskViewModel,
      taskService: mockTaskService,
      navigate: jest.fn(),
      currentDate: new Date(),
      onNavigateDate: jest.fn(),
      ...overrides
    });

    await flushAllPromises();

    return element;
  }

  test("Renders Team view default", async () => {
    const screen = await renderTaskScreen();

    expect(screen.tagName).toBe("MAIN");

    const filterSelect = screen.querySelector(".taskFilterSelect");
    expect(filterSelect).not.toBeNull();
    expect(filterSelect.value).toBe("Team");

    const lists = screen.querySelectorAll(".mock-task-list");
    expect(lists.length).toBe(3);

    expect(lists[0].textContent).toContain("Att göra - 2 tasks");
    expect(lists[1].textContent).toContain("Pågår - 1 tasks");
    expect(lists[2].textContent).toContain("Klar - 1 tasks");
  });

  test("Filters by specific person", async () => {
    localStorage.setItem("taskViewFilter", "Anna");

    const screen = await renderTaskScreen();

    const filterSelect = screen.querySelector(".taskFilterSelect");
    expect(filterSelect).not.toBeNull();
    expect(filterSelect.value).toBe("Anna");

    const lists = screen.querySelectorAll(".mock-task-list");

    expect(lists[0].textContent).toContain("Att göra - 1 tasks");
    expect(lists[1].textContent).toContain("Pågår - 0 tasks");
    expect(lists[2].textContent).toContain("Klar - 0 tasks");
  });

  test("Filters by old format person", async () => {
    localStorage.setItem("taskViewFilter", "Björn");

    const screen = await renderTaskScreen();

    const lists = screen.querySelectorAll(".mock-task-list");

    expect(lists[0].textContent).toContain("Att göra - 1 tasks");
    expect(lists[1].textContent).toContain("Pågår - 1 tasks");
  });

  test("Filters by Ingen (Unassigned)", async () => {
    localStorage.setItem("taskViewFilter", "Ingen");

    const screen = await renderTaskScreen();

    const lists = screen.querySelectorAll(".mock-task-list");

    expect(lists[2].textContent).toContain("Klar - 1 tasks");
  });

  test("Renders Archive view", async () => {
    localStorage.setItem("taskViewFilter", "Arkiv");

    const screen = await renderTaskScreen();

    const lists = screen.querySelectorAll(".mock-task-list");

    expect(lists.length).toBe(1);
    expect(lists[0].textContent).toContain("Stängd - 1 tasks");
  });

  test("Updates view when filter changes", async () => {
    const screen = await renderTaskScreen();

    const filterSelect = screen.querySelector(".taskFilterSelect");
    expect(filterSelect).not.toBeNull();

    filterSelect.value = "Anna";
    filterSelect.dispatchEvent(new Event("change", { bubbles: true }));

    await flushAllPromises();

    expect(localStorage.getItem("taskViewFilter")).toBe("Anna");

    const lists = screen.querySelectorAll(".mock-task-list");
    expect(lists[0].textContent).toContain("Att göra - 1 tasks");
  });

  test("Multi-View buttons change the view mode", async () => {
    const screen = await renderTaskScreen();

    expect(screen.querySelector(".taskBoard")).not.toBeNull();

    const toggleBtns = screen.querySelectorAll(".view-toggle-btn");
    expect(toggleBtns.length).toBe(3);

    const weekBtn = Array.from(toggleBtns).find(btn =>
      btn.textContent.includes("Vecka")
    );

    expect(weekBtn).toBeDefined();

    weekBtn.click();

    await flushAllPromises();

    expect(localStorage.getItem("taskViewMode")).toBe("week");
    expect(screen.querySelector(".week-view-grid")).not.toBeNull();

    const dayBtn = Array.from(toggleBtns).find(btn =>
      btn.textContent.includes("Dag")
    );

    expect(dayBtn).toBeDefined();

    dayBtn.click();

    await flushAllPromises();

    expect(localStorage.getItem("taskViewMode")).toBe("day");
    expect(screen.querySelector(".day-view-wrapper")).not.toBeNull();

    const boardBtn = Array.from(toggleBtns).find(btn =>
      btn.textContent.includes("Board")
    );

    expect(boardBtn).toBeDefined();

    boardBtn.click();

    await flushAllPromises();

    expect(localStorage.getItem("taskViewMode")).toBe("board");
    expect(screen.querySelector(".taskBoard")).not.toBeNull();
  });

  test("Shows Welcome Overlay with Slide11.jpg when no tasks exist", async () => {
    currentState.tasks = [];

    mockTaskService.getTasks.mockReturnValue([]);
    mockTaskViewModel.getTasks.mockReturnValue([]);
    mockTaskViewModel.getViewState.mockReturnValue({
      tasks: [],
      people: currentState.people,
      error: null
    });

    const screen = await renderTaskScreen();

    const emptyState = screen.querySelector(".empty-state-container");

    expect(emptyState).not.toBeNull();
    expect(emptyState.innerHTML).toContain("Slide11.jpg");
  });
});