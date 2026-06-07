import { jest } from '@jest/globals';
import { fireEvent } from '@testing-library/dom';

const flushPromises = () => new Promise(process.nextTick);

let renderSettings;
let loadState, saveState;
let notify;
let loadDemoByKey;
let clearAllContacts, initContactsDB, getAllContacts, importContacts;
let showToast;

describe("settingsView", () => {
    let container;
    let rerenderCallback;
    let mockTaskService;

    beforeEach(async () => {
        container = document.createElement("div");
        document.body.appendChild(container);
        
        mockTaskService = { fake: true };

        rerenderCallback = jest.fn();

        jest.resetModules();
        jest.clearAllMocks();

        const mockStorage = {
            loadState: jest.fn(),
            saveState: jest.fn()
        };

        const mockObserver = {
            notify: jest.fn()
        };

        const mockSeed = {
            loadDemoByKey: jest.fn()
        };

        const mockContactsDb = {
            clearAllContacts: jest.fn(),
            initContactsDB: jest.fn(),
            getAllContacts: jest.fn(),
            importContacts: jest.fn()
        };

        const mockToast = {
            showToast: jest.fn()
        };

        jest.unstable_mockModule("./storage.js", () => mockStorage);
        jest.unstable_mockModule("./observer.js", () => mockObserver);
        jest.unstable_mockModule("./taskList/seed.js", () => mockSeed);
        jest.unstable_mockModule("./utils/contactsDb.js", () => mockContactsDb);
        jest.unstable_mockModule("./utils/toast.js", () => mockToast);

        const view = await import("./views/settingsView.js");
        renderSettings = view.renderSettings;

        loadState = mockStorage.loadState;
        saveState = mockStorage.saveState;
        notify = mockObserver.notify;
        loadDemoByKey = mockSeed.loadDemoByKey;
        clearAllContacts = mockContactsDb.clearAllContacts;
        initContactsDB = mockContactsDb.initContactsDB;
        getAllContacts = mockContactsDb.getAllContacts;
        importContacts = mockContactsDb.importContacts;
        showToast = mockToast.showToast;

        // Default mock data
        loadState.mockReturnValue({
            people: ["Ingen", "Anna", "Björn"],
            settings: {
                teamName: "Test Team",
                weeklyTarget: 10,
                weeklyCRMTarget: 15
            }
        });



        // Mock global fetch or window methods if needed
        window.alert = jest.fn();
        window.confirm = jest.fn().mockReturnValue(true);
        window.URL.createObjectURL = jest.fn().mockReturnValue("blob:http://localhost/123");
        window.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test("Renders settings with current state", () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        expect(loadState).toHaveBeenCalled();
        const teamNameInput = container.querySelector("#teamNameInput");
        expect(teamNameInput.value).toBe("Test Team");

        const memberRows = container.querySelectorAll(".member-row input");
        expect(memberRows.length).toBe(2); // "Ingen" should be skipped
        expect(memberRows[0].value).toBe("Anna");
        expect(memberRows[1].value).toBe("Björn");
    });

    test("Cancels import if user declines confirm", async () => 
    {
        renderSettings(container, rerenderCallback, mockTaskService);
        window.confirm = jest.fn().mockReturnValue(false);
        const input = container.querySelector("input[type='file']");
        const jsonStr = JSON.stringify({ state: {} });
        const file = new File([jsonStr], "backup.json", { type: "application/json" });
        file.text = jest.fn().mockResolvedValue(jsonStr);
        await fireEvent.change(input, {target: {files: [file]}});
        await flushPromises();
        expect(saveState).not.toHaveBeenCalled();
    });

    test("Show toast if permission granted", async () => 
    {
        renderSettings(container, rerenderCallback, mockTaskService);
        const buttons = Array.from(container.querySelectorAll(".btn-load-demo"));
        const testBtn = buttons.find(b => b.textContent.includes("Testa Notis"));
        window.Notification = { permission: "denied"};
        testBtn.click();
        await flushPromises();
        expect(showToast).toHaveBeenCalledWith(
            "Kan ej skicka",
            "Vänligen aktivera notiser via knappen ovan först."
        );
    })

    test("Allows adding a new member", () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const addMemberBtn = container.querySelector(".btn-add-full");
        addMemberBtn.click();

        const memberRows = container.querySelectorAll(".member-row input");
        expect(memberRows.length).toBe(3);
    });

    test("Allows deleting a member", () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const deleteBtns = container.querySelectorAll(".btn-delete-small");
        expect(deleteBtns.length).toBe(2);

        deleteBtns[0].click(); // Delete Anna

        const memberRows = container.querySelectorAll(".member-row input");
        expect(memberRows.length).toBe(1);
        expect(memberRows[0].value).toBe("Björn");
    });

    test("Saves settings correctly", () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        // Change team name
        container.querySelector("#teamNameInput").value = "New Team";

        const saveBtn = container.querySelector(".btn-save-main");
        saveBtn.click();

        expect(loadState).toHaveBeenCalled();
        expect(saveState).toHaveBeenCalled();

        const savedState = saveState.mock.calls[0][0];
        expect(savedState.settings.teamName).toBe("New Team");
        expect(savedState.people).toEqual(["Ingen", "Anna", "Björn"]);

        expect(notify).toHaveBeenCalled();
        expect(rerenderCallback).toHaveBeenCalled();
    });

    test("Cancels settings changes", () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const cancelBtn = container.querySelector(".btn-cancel-main");
        cancelBtn.click();

        expect(window.confirm).toHaveBeenCalled();
        expect(rerenderCallback).toHaveBeenCalled();
    });

    test("Loads Workspace Demo", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const demoSelect = container.querySelector("select");
        demoSelect.value = "tech";
        
        const loadBtn = Array.from(container.querySelectorAll(".btn-load-demo")).find(b => b.textContent.includes("Ladda demoläge"));
        await loadBtn.click();

        expect(loadDemoByKey).toHaveBeenCalledWith("tech", mockTaskService);
        expect(rerenderCallback).toHaveBeenCalled();
    });

    test("Loads LIA Demo", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const demoSelect = container.querySelector("select");
        demoSelect.value = "lia";
        
        const loadBtn = Array.from(container.querySelectorAll(".btn-load-demo")).find(b => b.textContent.includes("Ladda demoläge"));
        await loadBtn.click();

        expect(loadDemoByKey).toHaveBeenCalledWith("lia", mockTaskService);
        expect(rerenderCallback).toHaveBeenCalled();
    });

    test("Exports backup properly", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        getAllContacts.mockResolvedValue([{ id: 1, name: "Test Contact" }]);

        const buttons = Array.from(container.querySelectorAll(".btn-load-demo"));
        const exportBtn = buttons.find(b => b.textContent.includes("Exportera Backup"));

        exportBtn.click();
        await flushPromises();
        await flushPromises(); // Give export time to await contactsDB

        expect(initContactsDB).toHaveBeenCalled();
        expect(getAllContacts).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test("Imports backup properly", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const input = container.querySelector("input[type='file']");
        const jsonStr = JSON.stringify({ state: { settings: { teamName: "Imported" } }, contacts: [] });
        const file = new File([jsonStr], "backup.json", { type: "application/json" });
        file.text = jest.fn().mockResolvedValue(jsonStr); // Mock for JSDOM

        await fireEvent.change(input, { target: { files: [file] } });
        await flushPromises();
        await flushPromises();

        expect(saveState).toHaveBeenCalled();
        expect(clearAllContacts).toHaveBeenCalled();
        expect(importContacts).toHaveBeenCalled();
        expect(notify).toHaveBeenCalled();
        expect(rerenderCallback).toHaveBeenCalled();
    });

    test("Deletes all data", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const clearBtn = container.querySelector(".btn-clear-all");

        const spyRemoveItem = jest.spyOn(Storage.prototype, "removeItem");

        await clearBtn.click();
        await flushPromises();

        expect(window.confirm).toHaveBeenCalled();
        expect(spyRemoveItem).toHaveBeenCalledWith("state");
        expect(initContactsDB).toHaveBeenCalled();
        expect(clearAllContacts).toHaveBeenCalled();
        expect(notify).toHaveBeenCalled();
        expect(rerenderCallback).toHaveBeenCalled();

        spyRemoveItem.mockRestore();
    });

    test("Requests notification permission", async () => {
        renderSettings(container, rerenderCallback, mockTaskService);

        const buttons = Array.from(container.querySelectorAll(".btn-load-demo"));
        const enableBtn = buttons.find(b => b.textContent.includes("Aktivera Notiser"));

        // Need to mock window.Notification
        const originalNotification = window.Notification;

        window.Notification = {
            requestPermission: jest.fn().mockResolvedValue("granted"),
            permission: "granted"
        };

        await enableBtn.click();
        await flushPromises();

        expect(window.Notification.requestPermission).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith("Tillåtet", "Notiser är nu aktiverade!");

        window.Notification = originalNotification;
    });

    test("Sends test notification via fallback if no SW", async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        renderSettings(container, rerenderCallback, mockTaskService);

        const buttons = Array.from(container.querySelectorAll(".btn-load-demo"));
        const testBtn = buttons.find(b => b.textContent.includes("Testa Notis"));

        const mockNotificationConstructor = jest.fn();

        // Replace Notification class with a mock function
        window.Notification = class {
            constructor(title, options) {
                mockNotificationConstructor(title, options);
            }
            static permission = "granted";
        };

        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: Promise.resolve({
                    showNotification: jest.fn().mockRejectedValue(new Error("SW error"))
                })
            },
            configurable: true
        });

        testBtn.click();
        await flushPromises();
        await flushPromises();

        expect(mockNotificationConstructor).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith("Framgång (Fallback)", expect.any(String));

        consoleSpy.mockRestore();
        delete window.Notification;
    });
});
