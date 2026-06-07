import { jest } from '@jest/globals';
import { waitFor, fireEvent } from '@testing-library/dom';

const flushPromises = () => new Promise(process.nextTick);
const flushAllPromises = async () => {
    for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
};

let renderDashboard;
let loadState;
let initContactsDB;
let getAllContacts;

describe("dashboardView", () => {
    let container;

    beforeEach(async () => {
        container = document.createElement("div");
        document.body.appendChild(container);
        localStorage.clear();

        jest.resetModules();
        jest.clearAllMocks();

        const mockStorage = {
            loadState: jest.fn()
        };

        const mockContactsDb = {
            initContactsDB: jest.fn(),
            getAllContacts: jest.fn()
        };

        jest.unstable_mockModule("../js/storage.js", () => mockStorage);
        jest.unstable_mockModule("../js/utils/contactsDb.js", () => mockContactsDb);

        const view = await import("../js/views/dashboardView.js");
        renderDashboard = view.renderDashboard;

        loadState = mockStorage.loadState;
        initContactsDB = mockContactsDb.initContactsDB;
        getAllContacts = mockContactsDb.getAllContacts;

        // Default mocks
        loadState.mockReturnValue({
            people: ["Ingen", "Anna", "Björn"],
            settings: {
                teamName: "Test Team",
                weeklyTarget: 5,
                weeklyCRMTarget: 5
            },
            tasks: [
                { id: 1, title: "Task 1", status: "Att göra", assigned: "Anna" },
                { id: 2, title: "Task 2", status: "Pågår", assigned: "Björn" },
                { id: 3, title: "Task 3", status: "Klar", assigned: "Anna", completedDate: new Date().toISOString() },
                { id: 4, title: "Unassigned", status: "Att göra", assigned: "Ingen" }
            ]
        });

        initContactsDB.mockResolvedValue();
        getAllContacts.mockResolvedValue([
            { id: 1, name: "Customer 1", company: "Corp", status: "Klar", assignedTo: "Anna", completedAt: new Date().toISOString() },
            { id: 2, name: "Customer 2", status: "Ej kontaktad", assignedTo: "Björn" },
            { id: 3, name: "Customer 3", status: "Pågående", assignedTo: "Ingen" }
        ]);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test("Renders Team Dashboard by default", async () => {
        await renderDashboard(container);
        await flushAllPromises();

        // Controls
        const filterSelect = container.querySelector(".taskFilterSelect");
        expect(filterSelect.value).toBe("Team");

        // Headings
        const headings = Array.from(container.querySelectorAll("h3")).map(h => h.textContent);
        expect(headings).toContain("Test Team – Uppgifter");
        expect(headings).toContain("Test Team – CRM");

        // Task stats
        const taskBox = container.querySelectorAll(".dashboard-box")[0];
        expect(taskBox.textContent).toContain("Totalt: 4");
        expect(taskBox.textContent).toContain("Lediga: 1");

        // CRM stats
        const crmBox = container.querySelectorAll(".dashboard-box")[1];
        expect(crmBox.textContent).toContain("Totalt: 3");
        expect(crmBox.textContent).toContain("Lediga: 1");
    });

    test("Renders specific person Dashboard", async () => {
        localStorage.setItem("dashboardViewFilter", "Anna");
        await renderDashboard(container);
        await flushAllPromises();

        // Should show Team and Anna (because Team is always shown in addition if specific person selected)
        const headings = Array.from(container.querySelectorAll("h3")).map(h => h.textContent);
        expect(headings).toContain("Test Team – Uppgifter");
        expect(headings).toContain("Anna – Uppgifter");
    });

    test("Renders ALL Dashboards", async () => {
        localStorage.setItem("dashboardViewFilter", "ALLA");
        await renderDashboard(container);
        await flushAllPromises();

        const headings = Array.from(container.querySelectorAll("h3")).map(h => h.textContent);
        expect(headings).toContain("Anna – Uppgifter");
        expect(headings).toContain("Björn – Uppgifter");
    });

    test("Toggles favorites", async () => {
        localStorage.setItem("dashboardViewFilter", "Team");
        await renderDashboard(container);
        await flushAllPromises();

        // Team doesn't have a star, so switch to ALLA to see Anna's star
        localStorage.setItem("dashboardViewFilter", "ALLA");
        await renderDashboard(container);
        await flushAllPromises();

        const starBtns = container.querySelectorAll(".dashboard-star");
        expect(starBtns.length).toBeGreaterThan(0);

        // Click Anna's star
        starBtns[0].click();
        await flushAllPromises();

        const favs = JSON.parse(localStorage.getItem("dashboard:favorites"));
        expect(favs.length).toBe(1);

        // Switch filter back to Team and verify Anna is shown alongside Team
        localStorage.setItem("dashboardViewFilter", "Team");
        await renderDashboard(container);
        await flushAllPromises();

        const headings = Array.from(container.querySelectorAll("h3")).map(h => h.textContent);
        expect(headings).toContain("Anna – Uppgifter");
    });

    test("Expands status details", async () => {
        await renderDashboard(container);
        await flushAllPromises();

        const statusGroup = container.querySelector(".status-group"); // First one is Veckomål
        const secondGroup = container.querySelectorAll(".status-group")[1]; // Att göra

        const toggle = secondGroup.querySelector(".status-toggle");
        toggle.click();
        await flushAllPromises();

        expect(secondGroup.classList.contains("open")).toBe(true);
        toggle.click();
        expect(secondGroup.classList.contains("open")).toBe(false);
    });

    test("Handles CRM loading failure gracefully", async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        getAllContacts.mockRejectedValue(new Error("DB failed"));
        await renderDashboard(container);
        await flushAllPromises();

        const crmBoxes = container.querySelectorAll(".dashboard-box.placeholder");
        expect(crmBoxes.length).toBeGreaterThan(0); // Placeholder container remains, but its content is updated

        const crmContents = container.innerHTML;
        expect(crmContents).toContain("Kunde inte ladda CRM-data");

        consoleSpy.mockRestore();
    });

    test("Changes dashboard view filter", async () => {
        await renderDashboard(container);
        await flushAllPromises();

        const filterSelect = container.querySelector(".taskFilterSelect");
        filterSelect.value = "Anna";
        filterSelect.dispatchEvent(new Event("change"));

        await flushAllPromises();
        expect(localStorage.getItem("dashboardViewFilter")).toBe("Anna");
    });
});
