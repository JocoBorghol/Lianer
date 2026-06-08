import { authApi } from "../Endpoints/authApi";
import { userApi } from "../Endpoints/userApi";
import { saveToken,getToken,clearToken,hasToken  } from "../Security/tokenStore";

// Dev only - fetches jwt from state
const CURRENT_USER_KEY = "lianer:auth:currentUser";


export class AuthService
{
    constructor(api = authApi, users = userApi) 
    {
        this.api = api;
        this.users = users;
        this.currentUser = readCurrentUser();
    }


    logout() {
        clearToken();
        clearCurrentUser();
        this.currentUser = null;

        notifyAuthChanged({
            isAuthenticated: false,
            user: null
        });
    }

    isAuthenticated() {
        return hasToken();
    }

    getToken() {
        return getToken();
    }

    getCurrentUser() {
        return this.currentUser ?? readCurrentUser();
    }


    async login(requestBody) 
    {
        const response = await this.api.login(requestBody);

        const token = getAccessToken(response);
        saveToken(token);

        const user = response.user ?? null;
        this.currentUser = user;
        saveCurrentUser(user);

        notifyAuthChanged({
            isAuthenticated: true,
            user
        });

        return {
            token,
            user,
            response
        };
    }

    async registerAndLogin(requestBody) 
    {
        validateRegisterRequest(requestBody);

        await this.users.create({
            firstName: requestBody.firstName.trim(),
            lastName: requestBody.lastName.trim(),
            email: requestBody.email.trim(),
            password: requestBody.password
        });

        return await this.login({
            email: requestBody.email,
            password: requestBody.password
        });
    }

}

export const authService = new AuthService();
function getJwtToken(response)
{
    const token = response?.accessToken;
        if (!token || typeof token !== "string") {
        throw new Error("Jwt token missing from response!");
    }
    return token;
}

function saveCurrentUser(user) {
    if (!user) {
        clearCurrentUser();
        return;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function readCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        clearCurrentUser();
        return null;
    }
}

function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

function notifyAuthChanged(detail) {
    window.dispatchEvent(new CustomEvent("authChanged", { detail }));
}

function validateRegisterRequest(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Register request must be an object.");
    }

    assertRequiredString(requestBody.firstName, "firstName");
    assertRequiredString(requestBody.lastName, "lastName");
    assertRequiredString(requestBody.email, "email");
    assertRequiredString(requestBody.password, "password");
}

function assertRequiredString(value, propertyName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Auth request property '${propertyName}' must be a non-empty string.`);
    }
}
