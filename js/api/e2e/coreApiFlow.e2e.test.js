 

/* Hardcoded url to ensure we never accidentally run these tests on production */
const TEST_BASE_URL = "http://localhost:5297";
 
 
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let apiRequest;
let ApiEndpoints;
let saveToken;
let clearToken;

beforeAll(async () => {
    installBrowserMocks();
    mockConfig(TEST_BASE_URL);

    ({ apiRequest } = await import("../dev/Client/apiClient.js"));
    ({ ApiEndpoints } = await import("../dev/Endpoints/Endpoints.js"));
    ({ saveToken, clearToken } = await import("../dev/Security/tokenStore.js"));
});

afterEach(() => {
    clearToken?.();
});

test("testing core API: create user, login, create activity, create note, create contact, update activity", async () => {
    const date = Date.now();
    const email = `e2e.user.${date}@example.com`;
    const password = "Password123!";

    /*
        Creates a user
    */
    const createdUserId = await apiRequest("core", ApiEndpoints.users.root(), {
        method: "POST",
        auth: false,
        body: {
            firstName: "E2E",
            lastName: "Tester",
            email,
            password
        }
    });

    expect(createdUserId).toMatch(UUID_REGEX);

    /*
        Testing login on the created user
    */
    const loginResponse = await apiRequest("core", ApiEndpoints.sessions.root(), {
        method: "POST",
        auth: false,
        body: {
            email,
            password
        }
    });

    expect(loginResponse.accessToken).toEqual(expect.any(String));
    expect(loginResponse.user.email).toBe(email);

    saveToken(loginResponse.accessToken);

    /*
        Creates activity
    */
    const createdActivity = await apiRequest("core", ApiEndpoints.activities.root(), {
        method: "POST",
        auth: true,
        body: {
            description: `Test activity ${date}`,
            assignedTo: null,
            createdBy: createdUserId,
            startDate: null,
            endDate: null,
            status: 1
        }
    });

    expect(createdActivity.id).toMatch(UUID_REGEX);
    expect(createdActivity.description).toBe(`Test activity ${date}`);
    expect(createdActivity.createdBy).toBe(createdUserId);
    expect(createdActivity.status).toBe(1);

    /*
        Creates note on activity
    */
    const createdNote = await apiRequest(
        "core",
        ApiEndpoints.notes.byActivityId(createdActivity.id),
        {
            method: "POST",
            auth: true,
            body: {
                title: "Test note",
                content: "Created from frontend e2e test",
                createdBy: createdUserId
            }
        }
    );

    expect(createdNote.id).toMatch(UUID_REGEX);
    expect(createdNote.activityId).toBe(createdActivity.id);
    expect(createdNote.title).toBe("Test note");
    expect(createdNote.createdBy).toBe(createdUserId);

    /*
        Creates contact
    */
    const createdContactId = await apiRequest("core", ApiEndpoints.contacts.root(), {
        method: "POST",
        auth: true,
        body: {
            firstName: "Test",
            lastName: "Contact",
            role: "Tester",
            company: "Lianer Test Company",
            phone: ["0700000000"],
            email: [`contact.${date}@example.com`],
            social: {
                linkedIn: null,
                website: null
            },
            status: 1,
            assignedTo: createdUserId,
            isFavorite: true
        }
    });

    expect(createdContactId).toMatch(UUID_REGEX);

    /*
        Updates activity status
    */
    const updatedActivity = await apiRequest("core", ApiEndpoints.activities.root(), {
        method: "PUT",
        auth: true,
        body: {
            id: createdActivity.id,
            description: `E2E activity updated ${date}`,
            assignedTo: createdUserId,
            startDate: null,
            endDate: null,
            status: 2
        }
    });

    expect(updatedActivity.id).toBe(createdActivity.id);
    expect(updatedActivity.description).toBe(`E2E activity updated ${date}`);
    expect(updatedActivity.assignedTo).toBe(createdUserId);
    expect(updatedActivity.status).toBe(2);
});

/*
    Create mock config
*/
function mockConfig(baseUrl) {
    Object.defineProperty(window, "__APP_CONFIG__", {
        value: Object.freeze({
            schemaVersion: 1,
            env: "testing",

            api: Object.freeze({
                targets: Object.freeze({
                    core: Object.freeze({
                        baseUrl
                    }),
                    features: Object.freeze({
                        baseUrl: "http://localhost:5001"
                    })
                }),

                apiVersion: "v1",
                apiBasePath: "/api/v1",
                requestTimeoutMs: 10000,
                credentials: "omit"
            }),

            auth: Object.freeze({
                scheme: "bearer",
                tokenStorageKey: "lianer.e2e.jwt"
            }),

            security: Object.freeze({
                requireHttps: false
            })
        }),
        writable: false,
        configurable: true,
        enumerable: false
    });
}


function installBrowserMocks() {
    globalThis.window = globalThis;

    const storage = new Map();

    globalThis.localStorage = {
        getItem(key) {
            return storage.has(key) ? storage.get(key) : null;
        },

        setItem(key, value) {
            storage.set(key, String(value));
        },

        removeItem(key) {
            storage.delete(key);
        },

        clear() {
            storage.clear();
        }
    };
}

