import { apiRequest } from "../Client/apiClient.js";
import { ApiEndpoints } from "./Endpoints.js";

const TARGET = "core";

export const noteApi = Object.freeze({
    getByActivityId(activityId, paging = {}) {
        validateGuid(activityId);

        const path = withQuery(ApiEndpoints.notes.byActivityId(activityId), {
            currentPage: paging.currentPage ?? 1,
            pageSize: paging.pageSize ?? 50
        });

        return apiRequest(TARGET, path, {
            auth: true
        });
    },

    getById(activityId, noteId) {
        validateGuid(activityId);
        validateGuid(noteId);

        return apiRequest(TARGET, ApiEndpoints.notes.byId(activityId, noteId), {
            auth: true
        });
    },

    create(activityId, requestBody) {
        validateGuid(activityId);
        validateCreateNote(requestBody);

        return apiRequest(TARGET, ApiEndpoints.notes.byActivityId(activityId), {
            method: "POST",
            auth: true,
            body: {
                title: requestBody.title,
                content: requestBody.content,
                createdBy: requestBody.createdBy
            }
        });
    },

    update(activityId, noteId, requestBody) {
        validateGuid(activityId);
        validateGuid(noteId);
        validateUpdateNote(requestBody);

        return apiRequest(TARGET, ApiEndpoints.notes.byId(activityId, noteId), {
            method: "PUT",
            auth: true,
            body: {
                title: requestBody.title ?? null,
                content: requestBody.content ?? null
            }
        });
    },

    delete(activityId, noteId) {
        validateGuid(activityId);
        validateGuid(noteId);

        return apiRequest(TARGET, ApiEndpoints.notes.byId(activityId, noteId), {
            method: "DELETE",
            auth: true
        });
    }
});

function withQuery(path, query) {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    });

    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
}

function validateCreateNote(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Create note request must be an object.");
    }

    assertRequiredString(requestBody.title, "title");
    assertRequiredString(requestBody.content, "content");
    validateGuid(requestBody.createdBy);
}

function validateUpdateNote(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Update note request must be an object.");
    }

    assertNullableString(requestBody.title, "title");
    assertNullableString(requestBody.content, "content");

    if (requestBody.title === undefined && requestBody.content === undefined) {
        throw new Error("Update note request must contain at least 'title' or 'content'.");
    }
}

function validateGuid(id) {
    const guidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof id !== "string" || !guidRegex.test(id)) {
        throw new Error("Id must be a valid UUID string.");
    }
}

function assertRequiredString(value, propertyName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Note request property '${propertyName}' must be a non-empty string.`);
    }
}

function assertNullableString(value, propertyName) {
    if (value !== null && value !== undefined && typeof value !== "string") {
        throw new Error(`Note request property '${propertyName}' must be a string, null, or undefined.`);
    }
}