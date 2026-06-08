import { apiRequest } from "../Client/apiClient.js";
import { ApiEndpoints } from "./Endpoints.js";

const TARGET = "core";
const activitiesEndpoint = ApiEndpoints.activities.root();

export const activityApi = Object.freeze({
    getAll(paging = {}) {
        const path = withQuery(activitiesEndpoint, {
            currentPage: paging.currentPage ?? 1,
            pageSize: paging.pageSize ?? 50
        });

        return apiRequest(TARGET, path, {
            auth: true
        });
    },

    getByUserId(userId, paging = {}) {
        validateGuid(userId);

        const path = withQuery(ApiEndpoints.activities.byUserId(userId), {
            currentPage: paging.currentPage ?? 1,
            pageSize: paging.pageSize ?? 50
        });

        return apiRequest(TARGET, path, {
            auth: true
        });
    },

    getById(id) {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.activities.byId(id), {
            auth: true
        });
    },

    create(requestBody) {
        validateCreateActivity(requestBody);

        return apiRequest(TARGET, activitiesEndpoint, {
            method: "POST",
            auth: true,
            body: {
                description: requestBody.description,
                assignedTo: requestBody.assignedTo ?? null,
                createdBy: requestBody.createdBy,
                startDate: requestBody.startDate ?? null,
                endDate: requestBody.endDate ?? null,
                status: requestBody.status ?? null
            }
        });
    },

    update(requestBody) {
        validateUpdateActivity(requestBody);

        return apiRequest(TARGET, activitiesEndpoint, {
            method: "PUT",
            auth: true,
            body: {
                id: requestBody.id,
                description: requestBody.description ?? null,
                assignedTo: requestBody.assignedTo ?? null,
                startDate: requestBody.startDate ?? null,
                endDate: requestBody.endDate ?? null,
                status: requestBody.status ?? null
            }
        });
    },

    delete(id) {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.activities.byId(id), {
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

function validateCreateActivity(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Create activity request must be an object.");
    }

    assertRequiredString(requestBody.description, "description");
    assertNullableGuid(requestBody.assignedTo, "assignedTo");
    validateGuid(requestBody.createdBy);
    assertNullableDateString(requestBody.startDate, "startDate");
    assertNullableDateString(requestBody.endDate, "endDate");
    assertNullableNumber(requestBody.status, "status");
}

function validateUpdateActivity(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Update activity request must be an object.");
    }

    validateGuid(requestBody.id);
    assertNullableString(requestBody.description, "description");
    assertNullableGuid(requestBody.assignedTo, "assignedTo");
    assertNullableDateString(requestBody.startDate, "startDate");
    assertNullableDateString(requestBody.endDate, "endDate");
    assertNullableNumber(requestBody.status, "status");
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
        throw new Error(`Activity request property '${propertyName}' must be a non-empty string.`);
    }
}

function assertNullableString(value, propertyName) {
    if (value !== null && value !== undefined && typeof value !== "string") {
        throw new Error(`Activity request property '${propertyName}' must be a string, null, or undefined.`);
    }
}

function assertNullableGuid(value, propertyName) {
    if (value === null || value === undefined) return;

    try {
        validateGuid(value);
    } catch {
        throw new Error(`Activity request property '${propertyName}' must be a valid UUID, null, or undefined.`);
    }
}

function assertNullableDateString(value, propertyName) {
    if (value === null || value === undefined) return;

    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        throw new Error(`Activity request property '${propertyName}' must be an ISO date string, null, or undefined.`);
    }
}

function assertNullableNumber(value, propertyName) {
    if (value === null || value === undefined) return;

    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error(`Activity request property '${propertyName}' must be an integer, null, or undefined.`);
    }
}