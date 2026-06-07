import { jest } from '@jest/globals';


let taskScreen;
let loadState;
let mockTaskService;
describe("taskScreen component", () => {
    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        localStorage.clear();

        const mockStorage = {
            loadState: jest.fn(),
            saveState: jest.fn()
        };
        mockTaskService = {
            getTasks: jest.fn(() => loadState.mock.results[0]?.value?.tasks || []),
            _compareRank: jest.fn(() => 0),
            moveTask: jest.fn(),
            changeStatus: jest.fn(),
            deleteTask: jest.fn()
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
        // Provide the constants from status.js directly or mock it
        const mockStatus = {
            TASK_STATUSES: {
                TODO: "Att göra",
                IN_PROGRESS: "Pågår",
                DONE: "Klar",
                CLOSED: "Stängd"
            }
        };
        jest.unstable_mockModule("./status.js", () => mockStatus);

        const module = await import("./taskList/taskScreen.js");
        taskScreen = module.taskScreen;
        loadState = mockStorage.loadState;

        // Default mock data
        loadState.mockReturnValue({
            people: ["Ingen", "Anna", "Björn"],
            tasks: [
                { id: 1, title: "T1", status: "Att göra", assigned: "Anna", assignedTo: ["Anna"] },
                { id: 2, title: "T2", status: "Pågår", assigned: "Björn", assignedTo: ["Björn"] },
                { id: 3, title: "T3", status: "Klar", assigned: "Ingen", assignedTo: ["Ingen"] },
                { id: 4, title: "T4", status: "Stängd", assigned: "Anna", assignedTo: ["Anna"] },
                // Old format task
                { id: 5, title: "T5", status: "Att göra", assigned: "Björn" }
            ]
        });
    });

    test("Renders Team view default", () => {
        const screen = taskScreen({
            taskService: mockTaskService,
            navigate: jest.fn()
        });
        expect(screen.tagName).toBe("MAIN");

        const filterSelect = screen.querySelector(".taskFilterSelect");
        expect(filterSelect.value).toBe("Team");

        const lists = screen.querySelectorAll(".mock-task-list");
        expect(lists.length).toBe(3); // TODO, IN_PROGRESS, DONE

        // T4 is Stängd, shouldn't be in main view. Tasks are 5 total, 4 active.
        expect(lists[0].textContent).toContain("Att göra - 2 tasks"); // T1, T5
        expect(lists[1].textContent).toContain("Pågår - 1 tasks"); // T2
        expect(lists[2].textContent).toContain("Klar - 1 tasks"); // T3
    });

    test("Filters by specific person", () => {
        localStorage.setItem("taskViewFilter", "Anna");
        const screen = taskScreen({
            taskService: mockTaskService,
            navigate: jest.fn()
        });

        const filterSelect = screen.querySelector(".taskFilterSelect");
        expect(filterSelect.value).toBe("Anna");

        const lists = screen.querySelectorAll(".mock-task-list");
        // Only T1 matches Anna in active statuses
        expect(lists[0].textContent).toContain("Att göra - 1 tasks"); // T1
        expect(lists[1].textContent).toContain("Pågår - 0 tasks");
        expect(lists[2].textContent).toContain("Klar - 0 tasks");
    });

    test("Filters by old format person", () => {
        localStorage.setItem("taskViewFilter", "Björn");
        const screen = taskScreen({
            taskService: mockTaskService,
            navigate: jest.fn()
        });

        const lists = screen.querySelectorAll(".mock-task-list");
        // T2 has assignedTo: ["Björn"], T5 has assigned: "Björn"
        expect(lists[0].textContent).toContain("Att göra - 1 tasks"); // T5
        expect(lists[1].textContent).toContain("Pågår - 1 tasks"); // T2
    });

    test("Filters by Ingen (Unassigned)", () => {
        localStorage.setItem("taskViewFilter", "Ingen");
        const screen = taskScreen({
    taskService: mockTaskService,
    navigate: jest.fn()
});

        const lists = screen.querySelectorAll(".mock-task-list");
        // Only T3 is Ingen
        expect(lists[2].textContent).toContain("Klar - 1 tasks"); // T3
    });

    test("Renders Archive view", () => {
        localStorage.setItem("taskViewFilter", "Arkiv");
        const screen = taskScreen({
            taskService: mockTaskService,
            navigate: jest.fn()
        });

        const lists = screen.querySelectorAll(".mock-task-list");
        expect(lists.length).toBe(1); // Only CLOSED column
        expect(lists[0].textContent).toContain("Stängd - 1 tasks"); // T4
    });

    test("Updates view when filter changes", () => {
        const screen = taskScreen({
            taskService: mockTaskService,
            navigate: jest.fn()
        });
        const filterSelect = screen.querySelector(".taskFilterSelect");

        filterSelect.value = "Anna";
        filterSelect.dispatchEvent(new Event("change"));

        expect(localStorage.getItem("taskViewFilter")).toBe("Anna");

        const lists = screen.querySelectorAll(".mock-task-list");
        expect(lists[0].textContent).toContain("Att göra - 1 tasks");
    });
});
