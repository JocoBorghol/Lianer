import { AppConfig } from "../../../config/appConfig.js";

/*
    All logic to save and use JWT-tokens
    (Temp solution - will be replaced with safer storing
    in next version. ) 
*/


export function saveToken(token) {
    if (!token || typeof token !== "string") {
        throw new Error("JWT token was invalid or missing. Nothing is saved.");
    }

    localStorage.setItem(AppConfig.auth.tokenStorageKey, token);
}

export function getToken() {
    return localStorage.getItem(AppConfig.auth.tokenStorageKey);
}

export function clearToken() {
    localStorage.removeItem(AppConfig.auth.tokenStorageKey);
}

export function hasToken() {
    return Boolean(getToken());
}