import { apiRequest } from "../Client/apiClient";
import { ApiEndpoints } from "./Endpoints";

const TATGET = "core";


export const authApi = Object.freeze({
    login(requestBody) {
        validateLoginRequest(requestBody);

        return apiRequest(TARGET, ApiEndpoints.sessions.root(), {
            method: "POST",
            auth: false,
            body: {
                email: requestBody.email.trim(),
                password: requestBody.password
            }
        });
    },

    google(accessToken) {
        if (!accessToken || typeof accessToken !== "string") {
            throw new Error("Google access token is required.");
        }

        return apiRequest(TARGET, ApiEndpoints.sessions.google(), {
            method: "POST",
            auth: false,
            body: { accessToken }
        });
    },

    getGoogleUrl() {
        return apiRequest(TARGET, ApiEndpoints.sessions.googleUrl(), {
            auth: false
        });
    }
});

function validateLoginRequest(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Login request must be an object.");
    }

    assertRequiredString(requestBody.email, "email");
    assertRequiredString(requestBody.password, "password");
}

function assertRequiredString(value, propertyName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Login request property '${propertyName}' must be a non-empty string.`);
    }
}