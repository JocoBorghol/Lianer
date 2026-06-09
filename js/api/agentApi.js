import { AppConfig } from "../config/appConfig.js";

const BASE = `${AppConfig.api.targets.core.baseUrl}${AppConfig.api.apiBasePath}/agent`;

/**
 * Gets the JWT token from local storage.
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem(AppConfig.auth.tokenStorageKey);
}

/**
 * Sends a message to the AI agent and receives a reply + optional proposal.
 *
 * @param {string} message - The user's natural language message.
 * @param {Array<{role:string, content:string}>} history - Conversation history.
 * @returns {Promise<{reply: string, proposal: object|null}>}
 */
export async function agentChat(message, history = []) {
    const token = getToken();
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, history }),
        signal: AbortSignal.timeout(AppConfig.api.requestTimeoutMs)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Agent chat failed (${res.status}): ${err}`);
    }

    return res.json();
}

/**
 * Confirms or rejects an AI proposal.
 *
 * @param {object} proposal - The proposal object returned by agentChat.
 * @param {boolean} confirmed - True to execute, false to cancel.
 * @returns {Promise<{success: boolean, message: string, resourceId: string|null, data: any}>}
 */
export async function agentConfirm(proposal, confirmed) {
    const token = getToken();
    const res = await fetch(`${BASE}/confirm`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ proposal, confirmed }),
        signal: AbortSignal.timeout(AppConfig.api.requestTimeoutMs)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Agent confirm failed (${res.status}): ${err}`);
    }

    return res.json();
}
