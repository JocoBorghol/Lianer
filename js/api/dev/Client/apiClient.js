import { AppConfig } from "../../../config/appConfig.js";
import { getToken } from "../Security/tokenStore.js";

function getApiTarget(target) {
    const t = AppConfig.api.targets[target];
    if(!t || !t.baseUrl)
    {
        throw new Error(`Api targets missing or unknownl..!`);
    }
    return t;
}

export async function apiRequest(target,path,options ={}){
    const targetConfig = getApiTarget(target);
    const url = `${targetConfig.baseUrl}${path}`;



    const headers = {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
    };

    if (options.auth === true) {
        const token = getToken();

        if (!token) {
            throw new Error("Missing JWT token. User is not logged in.");
        }

        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: AppConfig.api.credentials
    });

    const data = await readResponse(response);

    if (!response.ok) {
        console.error("API request failed:", {
            url,
            status: response.status,
            data
        });

        throw new Error(`API request failed. Response: ${response.status}`);
    }

    return data;
}

async function readResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await response.json();
    }

    return await response.text();
}