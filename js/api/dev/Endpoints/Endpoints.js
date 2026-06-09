import { AppConfig } from "../../../config/appConfig.js";

/*
    Exports all endpoints for our API, 
    use these to avoid hardcoded endpoints in all calls!
*/
const API_BASE_PATH = AppConfig.api.apiBasePath;
const Roots = Object.freeze({
    users: "/users",
    activities: "/activities",
    contacts: "/contacts",
    sessions: "/sessions"
});

function encodeHelper(value) {
    return encodeURIComponent(value);
}

function getFullEndpoint(endpointRoot) {
    const root = Roots[endpointRoot];

    if (!root) {
        throw new Error(`Invalid or unknown API endpoint root: ${endpointRoot}`);
    }

    return `${API_BASE_PATH}${root}`;
}

function byId(rootEndpoint, id) {
    return `${rootEndpoint}/${encodeHelper(id)}`;
}

/*
    Builds and stores endpoint paths to use from AppConfig.
    Example "/api/v1/users"
*/
const usersEndpoint = getFullEndpoint("users");
const activitiesEndpoint = getFullEndpoint("activities");
const contactsEndpoint = getFullEndpoint("contacts");
const sessionsEndpoint = getFullEndpoint("sessions");

/*
    Helper to build the endpoint for Notes
    Since notes are derived from activity, we cannot turn it into a fixed constant.
 */
function notesEndpoint(activityId) {
    return `${byId(activitiesEndpoint, activityId)}/notes`;
}

/*
    Returns all endpoints per controller to use
    For POST/PUT/DELETE just use "root"
*/
export const ApiEndpoints = Object.freeze({
    users: Object.freeze({
        root: () => usersEndpoint,
        byId: (id) => byId(usersEndpoint, id)
    }),

    activities: Object.freeze({
        root: () => activitiesEndpoint,
        byId: (id) => byId(activitiesEndpoint, id),
        byUserId: (userId) =>
            `${activitiesEndpoint}/user/${encodeHelper(userId)}`
    }),

    contacts: Object.freeze({
        root: () => contactsEndpoint,
        byId: (id) => byId(contactsEndpoint, id)
    }),

    sessions: Object.freeze({
        root: () => sessionsEndpoint,
        byId: (id) => byId(sessionsEndpoint, id),
        google: () => `${sessionsEndpoint}/google`,
        googleUrl: () => `${sessionsEndpoint}/google/url`
    }),

    notes: Object.freeze({
        byActivityId: (activityId) =>
            notesEndpoint(activityId),
        byId: (activityId, noteId) =>
            byId(notesEndpoint(activityId), noteId)
    })
});