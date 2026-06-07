import { apiRequest } from "../Client/apiClient";
import { ApiEndpoints } from "./Endpoints";

const TARGET = "core";
const contactsEndpoint = ApiEndpoints.contacts.root();

export const contactApi = Object.freeze({
    
    getAll() 
    {
        return apiRequest(TARGET, contactsEndpoint, {
            auth: true
        });
    }, 
    
    getById(id) 
    {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
            auth: true
        });
    },

    create(requestBody) 
    {
        validateCreateContact(requestBody);

        return apiRequest(TARGET, contactsEndpoint, {
            method: "POST",
            auth: true,
            body: {
                firstName: requestBody.firstName,
                lastName: requestBody.lastName,
                role: requestBody.role ?? "",
                company: requestBody.company ?? "",
                phone: normalizeStringArray(requestBody.phone),
                email: normalizeStringArray(requestBody.email),
                social: normalizeSocial(requestBody.social),
                status: requestBody.status ?? null,
                assignedTo: requestBody.assignedTo ?? null,
                isFavorite: requestBody.isFavorite ?? false
            }
        });
    },

    update(id, requestBody) 
    {
        validateGuid(id);
        validateUpdateContact(requestBody);

        return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
            method: "PUT",
            auth: true,
            body: {
                firstName: requestBody.firstName ?? null,
                lastName: requestBody.lastName ?? null,
                role: requestBody.role ?? null,
                company: requestBody.company ?? null,
                phone: requestBody.phone === undefined
                    ? null
                    : normalizeStringArray(requestBody.phone),
                email: requestBody.email === undefined
                    ? null
                    : normalizeStringArray(requestBody.email),
                social: requestBody.social === undefined
                    ? null
                    : normalizeSocial(requestBody.social),
                status: requestBody.status ?? null,
                assignedTo: requestBody.assignedTo ?? null,
                isFavorite: requestBody.isFavorite ?? null,
                completedAt: requestBody.completedAt ?? null,
                lastContactDate: requestBody.lastContactDate ?? null
            }
        });
    },

    delete(id) 
    {
        validateGuid(id);

        return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
            method: "DELETE",
            auth: true
        });
    }
});

function validateCreateContact(requestBody) 
{
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Create contact request must be an object.");
    }

    assertRequiredString(requestBody.firstName, "firstName");
    assertRequiredString(requestBody.lastName, "lastName");
    assertOptionalString(requestBody.role, "role");
    assertOptionalString(requestBody.company, "company");
    assertOptionalStringArray(requestBody.phone, "phone");
    assertOptionalStringArray(requestBody.email, "email");
    assertOptionalGuid(requestBody.assignedTo, "assignedTo");
    assertOptionalBoolean(requestBody.isFavorite, "isFavorite");
    assertOptionalNumber(requestBody.status, "status");
}

function validateUpdateContact(requestBody) 
{
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Update contact request must be an object.");
    }

    assertOptionalString(requestBody.firstName, "firstName");
    assertOptionalString(requestBody.lastName, "lastName");
    assertOptionalString(requestBody.role, "role");
    assertOptionalString(requestBody.company, "company");
    assertOptionalStringArray(requestBody.phone, "phone");
    assertOptionalStringArray(requestBody.email, "email");
    assertOptionalGuid(requestBody.assignedTo, "assignedTo");
    assertOptionalBoolean(requestBody.isFavorite, "isFavorite");
    assertOptionalNumber(requestBody.status, "status");
    assertOptionalDateString(requestBody.completedAt, "completedAt");
    assertOptionalDateString(requestBody.lastContactDate, "lastContactDate");
}

function normalizeStringArray(value) 
{
    if (value === null || value === undefined) return [];

    if (Array.isArray(value)) {
        return value
            .map(item => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    throw new Error("Expected string array or comma-separated string.");
}

function normalizeSocial(social) 
{
    if (!social || typeof social !== "object") {
        return {
            linkedIn: null,
            website: null
        };
    }

    return {
        linkedIn: social.linkedIn ?? social.linkedin ?? null,
        website: social.website ?? null
    };
}

function validateGuid(id) 
{
    const guidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof id !== "string" || !guidRegex.test(id)) {
        throw new Error("Id must be a valid UUID string.");
    }
}

function assertRequiredString(value, propertyName) 
{
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Contact request property '${propertyName}' must be a non-empty string.`);
    }
}

function assertOptionalString(value, propertyName) 
{
    if (value === undefined || value === null) return;

    if (typeof value !== "string") {
        throw new Error(`Contact request property '${propertyName}' must be a string, null, or undefined.`);
    }
}

function assertOptionalStringArray(value, propertyName) 
{
    if (value === undefined || value === null) return;

    if (typeof value === "string") return;

    if (!Array.isArray(value) || value.some(item => typeof item !== "string")) {
        throw new Error(`Contact request property '${propertyName}' must be a string array or comma-separated string.`);
    }
}

function assertOptionalGuid(value, propertyName) 
{
    if (value === undefined || value === null) return;

    try {
        validateGuid(value);
    } catch {
        throw new Error(`Contact request property '${propertyName}' must be a valid UUID, null, or undefined.`);
    }
}

function assertOptionalBoolean(value, propertyName) 
{
    if (value === undefined || value === null) return;

    if (typeof value !== "boolean") {
        throw new Error(`Contact request property '${propertyName}' must be a boolean, null, or undefined.`);
    }
}

function assertOptionalNumber(value, propertyName) 
{
    if (value === undefined || value === null) return;

    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error(`Contact request property '${propertyName}' must be an integer, null, or undefined.`);
    }
}

function assertOptionalDateString(value, propertyName) 
{
    if (value === undefined || value === null) return;

    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        throw new Error(`Contact request property '${propertyName}' must be an ISO date string, null, or undefined.`);
    }

}