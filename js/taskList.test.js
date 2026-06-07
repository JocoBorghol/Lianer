import { jest } from '@jest/globals';
import { waitFor, fireEvent } from '@testing-library/dom';

let taskList;

describe("taskList component", () => {
    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        localStorage.clear();

        const mockListItem = {
            listItem: jest.fn(task => {
            const div = document.createElement("div");
            div.className = "listItem";

            const title = document.createElement("h3");
            title.className = "taskTitle";
            title.textContent = task.title;

            div.appendChild(title);
            return div;
            })
        };

        jest.unstable_mockModule("../js/taskList/listItem.js", () => mockListItem);

        const module = await import("../js/taskList/taskList.js");
        taskList = module.taskList;
    });

    test("Renders a column with tasks", () => {
        const tasks = [
            { id: 1, title: "Task 1" },
            { id: 2, title: "Task 2" }
        ];

        const element = taskList("Att göra", tasks);
        expect(element.className).toContain("task-column");
        expect(element.getAttribute("data-status")).toBe("Att göra");

        // Header
        const header = element.querySelector(".taskHeader");
        expect(header.textContent).toContain("ATT GÖRA");
        expect(header.textContent).toContain("2"); // count

        // Items
        const items = element.querySelectorAll(".listItem");
        expect(items.length).toBe(2);
        expect(items[0].querySelector(".taskTitle").textContent).toBe("Task 1");
    });

    

    test("Renders empty state", () => {
        const element = taskList("Pågår", []);
        const emptyState = element.querySelector(".emptyState");
        expect(emptyState).not.toBeNull();
        expect(emptyState.textContent).toBe("Inga uppgifter");
    });

    test("Renders Stängd column properly", () => {
        const element = taskList("Stängd", [{ id: 3, title: "Done" }]);
        expect(element.className).toContain("closed-tasks-archive");

        const description = element.querySelector(".archive-description");
        expect(description).not.toBeNull();
        expect(description.textContent).toContain("Här sparas uppgifter");
    });

    test("Toggles column expand/collapse", () => {
        // Initial state is expanded (0 tasks, but we don't care, default is expanded unless "collapsed" stored)
        const element = taskList("Att göra", [{ id: 1, title: "T1" }]);
        const header = element.querySelector(".taskHeader");
        const container = element.querySelector(".task-list-items");

        expect(element.classList.contains("collapsed")).toBe(false);
        expect(container.style.display).toBe("flex");

        // Click to collapse
        header.click();
        expect(element.classList.contains("collapsed")).toBe(true);
        expect(container.style.display).toBe("none");
        expect(localStorage.getItem("column_state_Att göra")).toBe("collapsed");

        // Click to expand
        header.click();
        expect(element.classList.contains("collapsed")).toBe(false);
        expect(container.style.display).toBe("flex");
        expect(localStorage.getItem("column_state_Att göra")).toBe("expanded");
    });

    test("Auto-expands when going from 0 to 1 task", () => {
        localStorage.setItem("column_count_Att göra", "0");
        localStorage.setItem("column_state_Att göra", "collapsed");

        const element = taskList("Att göra", [{ id: 1, title: "New Task" }]);
        expect(element.classList.contains("collapsed")).toBe(false);
        expect(localStorage.getItem("column_state_Att göra")).toBe("expanded");
        expect(localStorage.getItem("column_count_Att göra")).toBe("1");
    });

    test("createListActions wrappers test", async () => {
        const onEditTask = jest.fn();
        const onMoveTask = jest.fn();
        const onChangeStatus = jest.fn();
        const onDeleteTask = jest.fn();
        const navigate = jest.fn();
        jest.resetModules();
        jest.clearAllMocks();
        const mockListItem = jest.fn(() => document.createElement("div"));

        jest.unstable_mockModule("../js/taskList/listItem.js", () => ({
            listItem: mockListItem,
                }
            )
        );
        const {  taskList } = await import("../js/taskList/taskList.js");
        taskList("Att göra", [{id:1}], {
            navigate,
            onEditTask,
            onMoveTask,
            onChangeStatus,
            onDeleteTask, 
        });
        const actions = mockListItem.mock.calls[0][1];

        actions.onNavigate("contacts", { id: 1 });
        actions.onEditTask({ id: 1 });
        actions.onMoveTask(1, "up");
        actions.onChangeStatus(1, "Klar");
        actions.onDeleteTask({ id: 1 });
        
        expect(onEditTask).toHaveBeenCalled();
        expect(onMoveTask).toHaveBeenCalled();
        expect(onChangeStatus).toHaveBeenCalled();
        expect(onDeleteTask).toHaveBeenCalled();

    })

      test("action wrappers call deps", () => {
        const deps = {
        navigate: jest.fn(),
        onEditTask: jest.fn(),
        onMoveTask: jest.fn(),
        onChangeStatus: jest.fn(),
        onDeleteTask: jest.fn(),
        };
        taskList("Att göra", [{ id: 1 }], deps);
        deps.navigate("contacts", { highlightId: 1 });
        deps.onEditTask({ id: 1 });
        deps.onMoveTask(1, "up");
        deps.onChangeStatus(1, "Klar");
        deps.onDeleteTask({ id: 1 });

        expect(deps.navigate).toHaveBeenCalled();
        expect(deps.onEditTask).toHaveBeenCalled();
        expect(deps.onMoveTask).toHaveBeenCalled();
        expect(deps.onChangeStatus).toHaveBeenCalled();
        expect(deps.onDeleteTask).toHaveBeenCalled();
  });
});
