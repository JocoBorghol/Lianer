import { apiRequest } from "../Client/apiClient.js";
import { ApiEndpoints } from "./Endpoints.js";

const TARGET = "core";
const usersEndpoint = ApiEndpoints.users.root();

export const userApi = Object.freeze({
    getAll() {
        return apiRequest(TARGET, usersEndpoint, {
            auth: true
        });
    },

    getById(id) {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.users.byId(id), {
            auth: true
        });
    },

    create(requestBody) {
        validateCreateUser(requestBody);

        return apiRequest(TARGET, usersEndpoint, {
            method: "POST",
            auth: false,
            body: requestBody
        });
    },

    update(id, requestBody) {
        validateGuid(id);
        validateUpdateUser(requestBody);

        return apiRequest(TARGET, ApiEndpoints.users.byId(id), {
            method: "PUT",
            auth: true,
            body: {
                id,
                firstName: requestBody.firstName ?? null,
                lastName: requestBody.lastName ?? null,
                email: requestBody.email ?? null
            }
        });
    },

    delete(id) {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.users.byId(id), {
            method: "DELETE",
            auth: true
        });
    }
});

function validateGuid(id) {
    const guidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof id !== "string" || !guidRegex.test(id)) {
        throw new Error("Id must be a valid UUID string.");
    }
}

function validateCreateUser(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Create user request must be an object.");
    }

    assertRequiredString(requestBody.firstName, "firstName");
    assertRequiredString(requestBody.lastName, "lastName");
    assertRequiredString(requestBody.email, "email");
    assertRequiredString(requestBody.password, "password");
}

function validateUpdateUser(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Update user request must be an object.");
    }

    assertNullableString(requestBody.firstName, "firstName");
    assertNullableString(requestBody.lastName, "lastName");
    assertNullableString(requestBody.email, "email");
}

function assertRequiredString(value, propertyName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`User request property '${propertyName}' must be a non-empty string.`);
    }
}

function assertNullableString(value, propertyName) {
    if (value !== null && value !== undefined && typeof value !== "string") {
        throw new Error(`User request property '${propertyName}' must be a string, null, or undefined.`);
    }
}