import { jest } from '@jest/globals';

// A helper to mock an IndexedDB request
function createMockRequest(resultValue, shouldFail = false) {
    let successCb = null;
    let errorCb = null;
    const req = {
        get onsuccess() { return successCb; },
        set onsuccess(cb) {
            successCb = cb;
            if (!shouldFail) {
                Promise.resolve().then(() => {
                    req.result = typeof resultValue === 'function' ? resultValue() : resultValue;
                    if (successCb) successCb({ target: req });
                });
            }
        },
        get onerror() { return errorCb; },
        set onerror(cb) {
            errorCb = cb;
            if (shouldFail) {
                Promise.resolve().then(() => {
                    req.error = new Error("Mock DB Error");
                    if (errorCb) errorCb({ target: req });
                });
            }
        },
        result: undefined,
        error: undefined
    };
    return req;
}

const mockObjectStore = {
    createIndex: jest.fn(),
    put: jest.fn((item) => createMockRequest(item)),
    get: jest.fn((id) => createMockRequest({ id, name: "Mock Name" })),
    getAll: jest.fn(() => createMockRequest([
        { id: 2, name: "Björn" },
        { id: 1, name: "Anna", isFavorite: true },
        { id: 3, name: "Cecilia", isFavorite: false }
    ])),
    delete: jest.fn(() => createMockRequest()),
    count: jest.fn(() => createMockRequest(0)),
    clear: jest.fn(() => createMockRequest())
};

const mockTransaction = {
    objectStore: jest.fn(() => mockObjectStore),
    get oncomplete() { return this._oncomplete; },
    set oncomplete(cb) {
        this._oncomplete = cb;
        Promise.resolve().then(() => { if (this._oncomplete) this._oncomplete(); });
    },
    get onerror() { return this._onerror; },
    set onerror(cb) { this._onerror = cb; }
};

const mockDB = {
    objectStoreNames: { contains: jest.fn(() => false) },
    createObjectStore: jest.fn(() => mockObjectStore),
    transaction: jest.fn(() => mockTransaction)
};

let openRequest;
global.indexedDB = {
    open: jest.fn(() => {
        openRequest = createMockRequest(mockDB);
        // Needs onupgradeneeded support
        let upgradeCb = null;
        Object.defineProperty(openRequest, 'onupgradeneeded', {
            get() { return upgradeCb; },
            set(cb) {
                upgradeCb = cb;
                // Trigger upgrade immediately
                Promise.resolve().then(() => {
                    if (upgradeCb) upgradeCb({ target: { result: mockDB } });
                });
            }
        });
        return openRequest;
    })
};

let initContactsDB, getAllContacts, getContact, addContact, updateContact, deleteContact, getFavoriteContacts, searchContacts, importContacts, getContactCount, clearAllContacts, groupAlphabetically;

describe("contactsDb", () => {
    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        localStorage.clear();

        const module = await import("../js/utils/contactsDb.js");
        initContactsDB = module.initContactsDB;
        getAllContacts = module.getAllContacts;
        getContact = module.getContact;
        addContact = module.addContact;
        updateContact = module.updateContact;
        deleteContact = module.deleteContact;
        getFavoriteContacts = module.getFavoriteContacts;
        searchContacts = module.searchContacts;
        importContacts = module.importContacts;
        getContactCount = module.getContactCount;
        clearAllContacts = module.clearAllContacts;
        groupAlphabetically = module.groupAlphabetically;

        // Clear the singleton instance
        // Note: because we use resetModules, the instance is null across test files, but inside this file it is preserved unless we do resetModules inside beforeEach. 
        // We ARE doing resetModules in beforeEach, so singleton is reset perfectly.
    });

    test("initContactsDB initializes db and creates store", async () => {
        const db = await initContactsDB();
        expect(db).toBe(mockDB);
        expect(indexedDB.open).toHaveBeenCalledWith("ContactsDB", 1);
        expect(mockDB.createObjectStore).toHaveBeenCalledWith("contacts", { keyPath: "id" });
    });

    test("initContactsDB migrates data from localStorage", async () => {
        localStorage.setItem("state", JSON.stringify({
            contacts: [{ id: "c1", name: "OldContact" }]
        }));

        await initContactsDB();

        expect(mockObjectStore.put).toHaveBeenCalled();
        const stateStr = localStorage.getItem("state");
        const state = JSON.parse(stateStr);
        expect(state.contacts).toBeUndefined(); // It should delete contacts from localstorage
    });

    test("getAllContacts returns sorted contacts", async () => {
        await initContactsDB();
        const result = await getAllContacts();

        // Expected to be sorted by name: Anna, Björn, Cecilia
        expect(result.length).toBe(3);
        expect(result[0].name).toBe("Anna");
        expect(result[1].name).toBe("Björn");
        expect(result[2].name).toBe("Cecilia");
    });

    test("getContact returns single contact", async () => {
        await initContactsDB();
        const result = await getContact(99);
        expect(result.id).toBe(99);
        expect(mockObjectStore.get).toHaveBeenCalledWith(99);
    });

    test("addContact puts contact and generates id if missing", async () => {
        await initContactsDB();
        const result = await addContact({ name: "New" });
        expect(result.id).toBeDefined();
        expect(mockObjectStore.put).toHaveBeenCalled();
    });

    test("updateContact calls addContact", async () => {
        await initContactsDB();
        const result = await updateContact({ id: 5, name: "Updated" });
        expect(result.id).toBe(5);
        expect(mockObjectStore.put).toHaveBeenCalled();
    });

    test("deleteContact removes from store", async () => {
        await initContactsDB();
        await deleteContact(10);
        expect(mockObjectStore.delete).toHaveBeenCalledWith(10);
    });

    test("getFavoriteContacts filters favorites", async () => {
        await initContactsDB();
        const favs = await getFavoriteContacts();
        expect(favs.length).toBe(1);
        expect(favs[0].name).toBe("Anna");
    });

    test("searchContacts filters correctly", async () => {
        await initContactsDB();

        // Mock getAll again just for this to have specific search fields
        mockObjectStore.getAll.mockReturnValueOnce(createMockRequest([
            { id: 1, name: "Ali Hassan", company: "A Corp" },
            { id: 2, name: "Anna", phone: ["070123"] }
        ]));

        const resA = await searchContacts("ali");
        expect(resA.length).toBe(1);
        expect(resA[0].name).toBe("Ali Hassan");

        mockObjectStore.getAll.mockReturnValueOnce(createMockRequest([
            { id: 1, name: "Ali Hassan", company: "A Corp" },
            { id: 2, name: "Anna", phone: ["070123"] }
        ]));

        const resB = await searchContacts("070");
        expect(resB.length).toBe(1);
        expect(resB[0].name).toBe("Anna");
    });

    test("importContacts puts multiple and resolves count", async () => {
        await initContactsDB();
        const count = await importContacts([
            { name: "Bulk1" },
            { name: "Bulk2" }
        ]);
        expect(count).toBe(2);
        expect(mockObjectStore.put).toHaveBeenCalledTimes(2);
    });

    test("getContactCount returns count", async () => {
        await initContactsDB();
        mockObjectStore.count.mockReturnValueOnce(createMockRequest(5));
        const count = await getContactCount();
        expect(count).toBe(5);
    });

    test("clearAllContacts clears store", async () => {
        await initContactsDB();
        await clearAllContacts();
        expect(mockObjectStore.clear).toHaveBeenCalled();
    });

    test("groupAlphabetically groups correctly", () => {
        const contacts = [
            { name: "Anna" },
            { name: "Björn" },
            { name: "Åsa" },
            { name: "Örjan" },
            { name: "123 Num" },
            { name: "" }, // Edge case: empty string -> #
            {} // Edge case: undefined name -> #
        ];

        const Map = groupAlphabetically(contacts);

        expect(Map.get("A").length).toBe(1);
        expect(Map.get("B").length).toBe(1);
        expect(Map.get("Å").length).toBe(1);
        expect(Map.get("Ö").length).toBe(1);
        expect(Map.get("#").length).toBe(3); // '1', '', undefined

        // Check sorting of keys
        const keys = Array.from(Map.keys());
        expect(keys).toEqual(["#", "A", "B", "Å", "Ö"]);
    });
});
