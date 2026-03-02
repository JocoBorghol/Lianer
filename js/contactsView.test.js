import { jest, beforeAll, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { fireEvent } from '@testing-library/dom';

// 1. GLOBALA MOCKAR FÖR CI/CD (LÄGG TILL DETTA HÄR)
beforeAll(() => {
    // Mocka alert eftersom JSDOM (GitHub Actions) inte stödjer popup-fönster
    global.alert = jest.fn();
    
    // Tysta ner console.log för att få renare loggar i din pipeline
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

// Din befintliga FileReader-mock
global.FileReader = class {
    readAsText() { 
        setTimeout(() => this.onload({ target: { result: "Namn,Telefon\nJohn Doe,123456" } }), 0);
    }
};

const flushPromises = () => new Promise(process.nextTick);

// Mock globals för QR och Kamera
global.qrcode = function () {
    this.addData = jest.fn();
    this.make = jest.fn();
    this.createImgTag = jest.fn().mockReturnValue("<img>");
};

global.Html5Qrcode = {
    getCameras: jest.fn().mockResolvedValue([{ id: "cam1", label: "Camera 1" }])
};

let renderContacts;
let initContactsDB, getAllContacts, searchContacts, addContact, updateContact, deleteContact, importContacts, groupAlphabetically;
let loadState;

describe("contactsView", () => {
    let container;

    beforeEach(async () => {
        container = document.createElement("div");
        document.body.appendChild(container);
        jest.resetModules();
        jest.clearAllMocks();

        const mockContactsDb = {
            initContactsDB: jest.fn(),
            getAllContacts: jest.fn(),
            addContact: jest.fn(),
            updateContact: jest.fn(),
            deleteContact: jest.fn(),
            searchContacts: jest.fn(),
            importContacts: jest.fn(),
            groupAlphabetically: jest.fn()
        };

        const mockStorage = {
            loadState: jest.fn()
        };

        const mockVcard = {
            exportContactsToVCard: jest.fn(),
            parseVCard: jest.fn(),
            createVCard: jest.fn()
        };

        // VIKTIGT: Se till att sökvägarna här matchar dina filnamn exakt (case sensitive)
        jest.unstable_mockModule("../js/utils/contactsDb.js", () => mockContactsDb);
        jest.unstable_mockModule("../js/storage.js", () => mockStorage);
        jest.unstable_mockModule("../js/utils/vcard.js", () => mockVcard);

        const view = await import("../js/views/contactsView.js");
        renderContacts = view.renderContacts;

        initContactsDB = mockContactsDb.initContactsDB;
        getAllContacts = mockContactsDb.getAllContacts;
        searchContacts = mockContactsDb.searchContacts;
        addContact = mockContactsDb.addContact;
        updateContact = mockContactsDb.updateContact;
        deleteContact = mockContactsDb.deleteContact;
        importContacts = mockContactsDb.importContacts;
        groupAlphabetically = mockContactsDb.groupAlphabetically;
        loadState = mockStorage.loadState;

        loadState.mockReturnValue({ people: ["Ingen", "Anna", "Björn"] });

        groupAlphabetically.mockImplementation((contacts) => {
            const map = new Map();
            contacts.forEach(c => {
                const letter = (c.name || "?").charAt(0).toUpperCase();
                if (!map.has(letter)) map.set(letter, []);
                map.get(letter).push(c);
            });
            return map;
        });

        getAllContacts.mockResolvedValue([
            { id: "1", name: "Test Contact", role: "Dev", company: "Company", phone: ["123"], email: ["test@example.com"], status: "Ej kontaktad", assignedTo: "Anna", isFavorite: false },
            { id: "2", name: "Another Contact", status: "Klar", isFavorite: true, assignedTo: "Björn" }
        ]);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test("Renders list of contacts", async () => {
        await renderContacts(container);
        expect(initContactsDB).toHaveBeenCalled();
        expect(getAllContacts).toHaveBeenCalled();

        const items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(2);
        expect(items[0].textContent).toContain("Test Contact");
        expect(items[1].textContent).toContain("Another Contact");
    });

    test("Filters by search term", async () => {
        await renderContacts(container);
        const searchInput = container.querySelector(".contacts-search");

        searchContacts.mockResolvedValue([{ id: "1", name: "Test Contact", isFavorite: false }]);

        searchInput.value = "Test";
        searchInput.dispatchEvent(new Event("input"));

        await new Promise(r => setTimeout(r, 250));
        await flushPromises();

        expect(searchContacts).toHaveBeenCalledWith("Test");
        const items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain("Test Contact");
    });

    test("Filters by status and assignee", async () => {
        await renderContacts(container);
        const selects = container.querySelectorAll(".contacts-actions select");
        const statusSelect = selects[0];
        const assigneeSelect = selects[1];

        statusSelect.value = "Klar";
        statusSelect.dispatchEvent(new Event("change"));

        let items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(1);

        statusSelect.value = "Alla";
        statusSelect.dispatchEvent(new Event("change"));

        assigneeSelect.value = "Anna";
        assigneeSelect.dispatchEvent(new Event("change"));

        items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(1);
    });

    test("Toggles favorites view", async () => {
        await renderContacts(container);

        const buttons = Array.from(container.querySelectorAll("button"));
        const toggleFavBtn = buttons.find(b => b.textContent.includes("Favoriter") || b.textContent.includes("Alla"));
        expect(toggleFavBtn).toBeDefined();

        toggleFavBtn.click();
        await flushPromises();

        let items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(1);

        toggleFavBtn.click();
        await flushPromises();
        items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(2);
    });

    test("Can click a contact to view details", async () => {
        await renderContacts(container);
        const items = container.querySelectorAll(".contact-item");

        items[0].click();
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        expect(detailPanel.innerHTML).toContain("Test Contact");
        expect(detailPanel.innerHTML).toContain("test@example.com");
    });

    test("Can toggle star on a contact in list", async () => {
        await renderContacts(container);
        const items = container.querySelectorAll(".contact-item");
        const starBtn = items[0].querySelector(".contact-item-star");

        updateContact.mockResolvedValue();
        starBtn.click();
        await flushPromises();

        expect(updateContact).toHaveBeenCalled();
    });

    test("Switches detail tabs", async () => {
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        const tabs = detailPanel.querySelectorAll(".detail-tab-btn");
        expect(tabs.length).toBe(2);

        tabs[1].click();
        expect(detailPanel.querySelector("#tab-history").classList.contains("active")).toBe(true);

        tabs[0].click();
        expect(detailPanel.querySelector("#tab-info").classList.contains("active")).toBe(true);
    });

    test("Creates a new contact via modal", async () => {
        await renderContacts(container);
        const addBtn = container.querySelector(".btn-add");
        addBtn.click();
        await flushPromises();

        const overlay = document.body.querySelector(".csv-modal-overlay");
        expect(overlay).not.toBeNull();

        const inputs = overlay.querySelectorAll("input");
        inputs[0].value = "New User";
        inputs[3].value = "321";

        const buttons = overlay.querySelectorAll("button");
        const saveBtn = Array.from(buttons).find(b => b.textContent === "Spara");

        addContact.mockResolvedValue();
        getAllContacts.mockResolvedValue([
            { id: "1", name: "Test Contact" },
            { id: "2", name: "Another Contact" },
            { id: "3", name: "New User", phone: ["321"] }
        ]);

        saveBtn.click();
        await flushPromises();

        expect(addContact).toHaveBeenCalled();
        expect(document.body.querySelector(".csv-modal-overlay")).toBeNull();

        const items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(3);
    });

    test("Deletes a contact", async () => {
        window.confirm = jest.fn().mockReturnValue(true);
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const deleteBtn = container.querySelector(".btn-danger");
        expect(deleteBtn).not.toBeNull();

        deleteContact.mockResolvedValue();
        getAllContacts.mockResolvedValue([
            { id: "2", name: "Another Contact", status: "Klar", isFavorite: true, assignedTo: "Björn" }
        ]);

        deleteBtn.click();
        await flushPromises();

        expect(deleteContact).toHaveBeenCalledWith("1");

        const items = container.querySelectorAll(".contact-item");
        expect(items.length).toBe(1);
    });

    test("Changes status via CRM tab", async () => {
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        const tabs = detailPanel.querySelectorAll(".detail-tab-btn");
        tabs[1].click();

        const selects = detailPanel.querySelectorAll("select");
        const statusSelect = selects[0];

        updateContact.mockResolvedValue();
        statusSelect.value = "Förlorad";
        statusSelect.dispatchEvent(new Event("change"));
        await flushPromises();

        expect(updateContact).toHaveBeenCalled();
    });

    test("Renders CSV Import Modal and handles import", async () => {
        await renderContacts(container);
        const importCsvInput = container.querySelector("input[accept='.csv']");

        // Mock a file selection
        const file = new File(["Namn,Telefon\nJohn Doe,123456"], "test.csv", { type: "text/csv" });
        file.text = jest.fn().mockResolvedValue("Namn,Telefon\nJohn Doe,123456");
        Object.defineProperty(importCsvInput, 'files', { value: [file] });

        // Mock FileReader
        const mockFileReader = {
            readAsText: jest.fn(),
            onload: null,
            result: "Namn,Telefon\nJohn Doe,123456"
        };
        window.FileReader = jest.fn(() => mockFileReader);

        fireEvent.change(importCsvInput);

        // Trigger onload
        if (mockFileReader.onload) mockFileReader.onload({ target: { result: mockFileReader.result } });
        await flushPromises();

        const overlay = document.body.querySelector(".csv-modal-overlay");
        expect(overlay).not.toBeNull();
        expect(overlay.innerHTML).toContain("CSV Import");

        // Find import button
        const buttons = overlay.querySelectorAll("button");
        const importBtn = Array.from(buttons).find(b => b.textContent.includes("Importera"));

        importContacts.mockResolvedValue();
        importBtn.click();
        await flushPromises();

        expect(importContacts).toHaveBeenCalled();
        expect(document.body.querySelector(".csv-modal-overlay")).toBeNull();
    });

    test("Renders Social Links in Info Tab", async () => {
        getAllContacts.mockResolvedValue([
            { id: "1", name: "Social Contact", social: { linkedin: "http://linkedin", website: "http://website" } }
        ]);
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        const socialLinks = detailPanel.querySelectorAll(".social-btn");
        expect(socialLinks.length).toBe(2);
        expect(socialLinks[0].href).toContain("linkedin");
    });

    test("Renders Timeline in CRM Tab", async () => {
        getAllContacts.mockResolvedValue([
            { id: "1", name: "Timeline Contact", interactionLog: [{ date: "2026-01-01T12:00:00.000Z", content: "Met for coffee", type: "note" }] }
        ]);
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        const tabs = detailPanel.querySelectorAll(".detail-tab-btn");
        tabs[1].click(); // Go to CRM tab

        const timeline = detailPanel.querySelector(".crm-timeline");
        expect(timeline).not.toBeNull();
        expect(timeline.innerHTML).toContain("Met for coffee");
    });

    test("Pre-fills data in Edit Contact Modal", async () => {
        getAllContacts.mockResolvedValue([
            { id: "1", name: "Edit Me", role: "Developer", phone: ["111"], email: ["edit@mem.com"] }
        ]);
        await renderContacts(container, { highlightId: "1" });
        await flushPromises();

        const detailPanel = container.querySelector(".contacts-detail");
        const buttons = detailPanel.querySelectorAll("button");
        const editBtn = Array.from(buttons).find(b => b.textContent.includes("Redigera"));
        editBtn.click();

        const overlay = document.body.querySelector(".csv-modal-overlay");
        expect(overlay).not.toBeNull();

        const nameInput = overlay.querySelector("input[type='text']");
        expect(nameInput.value).toBe("Edit Me");

        // Cleanup
        overlay.remove();
    });

    test("Toggles Mobile View classes", async () => {
        // Change window.innerWidth to mobile size
        global.innerWidth = 500;
        global.dispatchEvent(new Event('resize'));

        await renderContacts(container);
        const items = container.querySelectorAll(".contact-item");

        items[0].click();
        await flushPromises();

        const master = container.querySelector(".contacts-master");
        const detail = container.querySelector(".contacts-detail");

        expect(master.classList.contains("hidden-mobile")).toBe(true);
        expect(detail.classList.contains("hidden-mobile")).toBe(false);

        // Go back
        const backBtn = detail.querySelector(".detail-back-btn");
        backBtn.click();

        expect(master.classList.contains("hidden-mobile")).toBe(false);
        expect(detail.classList.contains("hidden-mobile")).toBe(true);

        // Reset window size for subsequent tests
        global.innerWidth = 1024;
    });
});