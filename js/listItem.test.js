import { jest } from '@jest/globals';
import { waitFor } from '@testing-library/dom';

let listItem;
let addTaskDialog;
let TASK_STATUSES;

describe("listItem component", () => {
    let mockWindowDispatchEvent;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();

        mockWindowDispatchEvent = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => { });
        window.confirm = jest.fn().mockReturnValue(true);
        window.prompt = jest.fn().mockReturnValue("Reason");

        TASK_STATUSES = {
            TODO: "Att göra",
            IN_PROGRESS: "Pågår",
            DONE: "Klar",
            CLOSED: "Stängd"
        };

        const mockStorage = {
            removeById: jest.fn(),
            loadState: jest.fn().mockReturnValue({
                tasks: [
                    { id: 1, title: "T1", status: "Att göra" },
                    { id: 2, title: "T2", status: "Att göra" }
                ]
            }),
            saveState: jest.fn()
        };
        const mockDialog = {
            addTaskDialog: jest.fn(),
            showConfirmDialog: jest.fn().mockResolvedValue(true),
            showPromptDialog: jest.fn().mockResolvedValue("Reason")
        };
        const mockView = { setView: jest.fn() };
        const mockStatus = { TASK_STATUSES };

        jest.unstable_mockModule("../js/storage.js", () => mockStorage);
        jest.unstable_mockModule("../js/comps/dialog.js", () => mockDialog);
        jest.unstable_mockModule("../js/views/viewController.js", () => mockView);
        jest.unstable_mockModule("../js/status.js", () => mockStatus);

        const module = await import("./taskList/listItem.js");
        listItem = module.listItem;

        addTaskDialog = mockDialog.addTaskDialog;
    });

    afterEach(() => {
        mockWindowDispatchEvent.mockRestore();
    });

    test("Renders a basic task item", () => {
        const task = { id: 1, title: "Test Task", description: "Desc", status: "Att göra", assignedTo: ["Anna"] };
        const el = listItem(task);

        expect(el.className).toContain("listItem");
        expect(el.querySelector(".taskTitle").textContent).toBe("Test Task");
        expect(el.querySelector(".taskDescription").textContent).toBe("Desc");
        expect(el.querySelector(".statusBadge").textContent).toBe("Att göra");

        const avatar = el.querySelector(".assignee-avatar-circle");
        expect(avatar.textContent).toBe("A");  
    });

    test("Renders default values if fields missing", () => {
        const task = { id: 2, status: "Pågår" };
        const el = listItem(task);

        expect(el.querySelector(".taskTitle").textContent).toBe("Utan titel");
        expect(el.querySelector(".taskDescription").textContent).toBe("Ingen beskrivning.");
        expect(el.querySelector(".avatar-empty").textContent).toContain("Ledig");
    });



    test("Opens edit dialog when clicking avatar", () => {
        const task = { id: 1, status: "Att göra", assignedTo: ["Anna"] };
        const el = listItem(task, {
        onEditTask: addTaskDialog
        });
        const avatarContainer = el.querySelector(".assignee-avatars-list");
        avatarContainer.click();

        expect(addTaskDialog).toHaveBeenCalledWith(task);
    });

    test("Keyboard Enter/Space opens edit dialog on avatar", () => {
        const task = { id: 1, status: "Att göra", assignedTo: ["Anna"] };
        const el = listItem(task, {
        onEditTask: addTaskDialog
        });
                
        const avatarContainer = el.querySelector(".assignee-avatars-list");
        avatarContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(addTaskDialog).toHaveBeenCalledWith(task);

        avatarContainer.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        expect(addTaskDialog).toHaveBeenCalledTimes(2);
    });

    test("Moves task up and down within status", () => {
        const task = { id: 2, status: "Att göra" }; // task 2 is at index 1
        const onMoveTask = jest.fn();
        const el = listItem(task, { onMoveTask });

        const upBtn = [...el.querySelectorAll(".controlBtn")]
            .find(b => b.textContent.includes("↑"));

        upBtn.click();

        expect(onMoveTask).toHaveBeenCalledWith(2, "up");
    });

    test("Moves task status left and right", () => {
    const task = { id: 1, status: "Pågår" };

    const onChangeStatus = jest.fn();

    const el = listItem(task, { onChangeStatus });

    const leftBtn = el.querySelector('button[aria-label="Flytta vänster"]');
    const rightBtn = el.querySelector('button[aria-label="Flytta höger"]');

    leftBtn.click();
    expect(onChangeStatus).toHaveBeenCalledWith(1, "Att göra");

    rightBtn.click();
    expect(onChangeStatus).toHaveBeenCalledWith(1, "Klar");
    });

    test("Deletes task (for closed)", async () => {
        const task = { id: 1, status: "Stängd" };
        const onDeleteTask = jest.fn();
        const el = listItem(task, { onDeleteTask});

        const deleteBtn = el.querySelector('button[aria-label="Ta bort"]');
        deleteBtn.click();

        await waitFor(() => {
            expect(onDeleteTask).toHaveBeenCalledWith(task);
        });
    });

    test("Delete button calls onDeleteTask (open)", () => {
        const task = { id: 1, status: "Att göra" };
        const onDeleteTask = jest.fn();

        const el = listItem(task, { onDeleteTask });

        const deleteBtn = el.querySelector('button[aria-label="Ta bort"]');
        deleteBtn.click();

        expect(onDeleteTask).toHaveBeenCalledWith(task);
    });

    test("formatDate handles special values correctly,", () => {
        const el = listItem(
            { status: "Att göra", createdAt: "Nyss" },
            {}
        );
        expect(el.querySelector(".meta-value").textContent).toBe("Nyss");
    });

        test("formatDate returns original if date is invalid,", () =>
    {
        const el = listItem(
            { status: "Att göra", createdAt: "invalid" },
            {}
        );
        expect(el.querySelector(".meta-value").textContent).toBe("invalid");
    });

    test("does not render contact link if missing", () => 
        {
        const el = listItem(
            { status: "Att göra" },
            {}
        );

        expect(el.querySelector(".task-contact-explicit")).toBeNull();
        }
    );
        // We have to mock the fact that it was created as a sibling to h3 and p inside the taskMainContent
        // The implementation appends to mainContent, unfortunately it doesn't give it a separate class 
        // Wait, it gave it the class "task-contact-explicit"
  test("Renders explicit contact link and interacts", () => {
    const task = {
      id: 1,
      status: "Att göra",
      contactId: 99,
      contactName: "Test Contact",
    };

    const onNavigate = jest.fn();
    const el = listItem(task, {
        onNavigate,
        onEditTask: jest.fn(),
    });

    const linkDiv = el.querySelector(".task-contact-pill");
    expect(linkDiv).not.toBeNull();

    linkDiv.click();
    
    expect(onNavigate).toHaveBeenCalledWith("contacts", { highlightId: 99 });
  });

    test("Formats deadline correctly and highlights overdue", () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const task = { id: 1, status: "Att göra", deadline: pastDate };
        const el = listItem(task);

        const overdueItem = el.querySelector(".deadline-overdue");
        expect(overdueItem).not.toBeNull();
    });
});
