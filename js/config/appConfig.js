/*
    We use this copy of configuration(pointer not the object), so our modules
    aren't depending directly on the global browser state. 
    Its more centralized and safer to store it like this. 
*/
const config = window.__APP_CONFIG__;

if (!config) {
    throw new Error("Missing config..!");
}

function normalizeApiVersion(version) {
    if (typeof version !== "string" || version.trim() === "") {
        throw new Error("Invalid config value: api.apiVersion");
    }

    const cleaned = version.trim().replace(/^\/+/, "");

    if (!/^v\d+$/.test(cleaned)) {
        throw new Error(`Invalid api version format: ${version}`);
    }

    return cleaned;
}

const apiVersion = normalizeApiVersion(config.api.apiVersion);
export const AppConfig = Object.freeze({
    ...config, //creates shallow copy
    // also replaces apiversion in copy with a normalized /api/version to use in our endpounts'
    
    api:Object.freeze({
        ...config.api,
        apiVersion,
        apiBasePath: `/api/${apiVersion}`
    })
})

