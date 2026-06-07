import { jest } from '@jest/globals';

let initSeed, loadDemoWorkspace, loadDemoLIA;
let loadState, saveState;
let initContactsDB, importContacts, getAllContacts;
let createTask;

describe("seed data utilities", () => {
    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const mockStorage = {
            loadState: jest.fn(),
            saveState: jest.fn()
        };

        const mockContactsDb = {
            initContactsDB: jest.fn().mockResolvedValue(),
            importContacts: jest.fn().mockResolvedValue(),
            getAllContacts: jest.fn().mockResolvedValue([]),
            clearAllContacts: jest.fn().mockResolvedValue()
        };

        const mockTasks = {
            createTask: jest.fn((input) => ({ ...input, isCreated: true }))
        };

        jest.unstable_mockModule("./storage.js", () => mockStorage);
        jest.unstable_mockModule("./utils/contactsDb.js", () => mockContactsDb);
        jest.unstable_mockModule("./data/tasks.js", () => mockTasks);

        const module = await import("./taskList/seed.js");
        initSeed = module.initSeed;
        loadDemoWorkspace = module.loadDemoWorkspace;
        loadDemoLIA = module.loadDemoLIA;

        loadState = mockStorage.loadState;
        saveState = mockStorage.saveState;
        initContactsDB = mockContactsDb.initContactsDB;
        importContacts = mockContactsDb.importContacts;
        getAllContacts = mockContactsDb.getAllContacts;
        createTask = mockTasks.createTask;
    });

    test("initSeed populates state if empty",async () => {
        loadState.mockReturnValue({}); // Empty state

        initSeed();

        expect(saveState).toHaveBeenCalled();
        const state = saveState.mock.calls[0][0];

        expect(state.people).toBeDefined();
        expect(state.people.length).toBeGreaterThan(0);
        expect(state.tasks).toBeDefined();
        expect(state.tasks.length).toBeGreaterThan(0);
        expect(createTask).toHaveBeenCalled();

        expect(initContactsDB).toHaveBeenCalled(); // Contacts are also seeded
    });

    test("initSeed does not overwrite existing people/tasks",async () => {
        loadState.mockReturnValue({
            people: ["Custom Person"],
            tasks: [{ id: 1, title: "Custom Task" }]
        });

        initSeed();

        expect(saveState).toHaveBeenCalled();
        const state = saveState.mock.calls[0][0];

        expect(state.people).toEqual(["Joco", "Hussein", "Alexander", "Custom Person"]);
        expect(state.tasks).toEqual([{ id: 1, title: "Custom Task" }]);
        expect(createTask).not.toHaveBeenCalled();
    });

    test("loadDemoWorkspace replaces state with tech data", async () => {
        loadState.mockReturnValue({
            people: ["Old"],
            tasks: []
        });

        const mockTaskService = { importDemoTasks: jest.fn() };
        await loadDemoWorkspace(mockTaskService);

        expect(saveState).toHaveBeenCalled();
        const state = saveState.mock.calls[0][0];

        expect(state.people).toContain("Linnea Malmgren");
        
        expect(mockTaskService.importDemoTasks).toHaveBeenCalled();
        const importedTasks = mockTaskService.importDemoTasks.mock.calls[0][0];
        expect(importedTasks.length).toBe(20);
        expect(importedTasks[0].title).toBe("Konfigurera CI/CD-pipeline");

        expect(initContactsDB).toHaveBeenCalled();
        expect(importContacts).toHaveBeenCalled();
    });

    test("loadDemoLIA replaces state with LIA data", async () => {
        loadState.mockReturnValue({
            people: ["Old"],
            tasks: []
        });

        const mockTaskService = { importDemoTasks: jest.fn() };
        await loadDemoLIA(mockTaskService);

        expect(saveState).toHaveBeenCalled();
        const state = saveState.mock.calls[0][0];

        expect(state.people).toContain("Ali Hassan");
        
        expect(mockTaskService.importDemoTasks).toHaveBeenCalled();
        const importedTasks = mockTaskService.importDemoTasks.mock.calls[0][0];
        expect(importedTasks.length).toBe(20);
        expect(importedTasks[0].title).toBe("Ring Axis Communications");

        expect(initContactsDB).toHaveBeenCalled();
    });
});
