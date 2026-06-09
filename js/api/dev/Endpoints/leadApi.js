import { apiRequest } from "../Client/apiClient.js";
import { ApiEndpoints } from "./Endpoints.js";
const TARGET = "features";

export const leadApi = Object.freeze({
    getAll({ page = 1, pageSize = 20, search = "", sortBy = "created", sortOrder = "desc" } = {}) {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
            sortBy,
            sortOrder
        });

        if (search.trim()) {
            params.set("search", search.trim());
        }

        return apiRequest(TARGET, `${ApiEndpoints.leads.root()}?${params.toString()}`, {
            auth: false
        });
    },

    enrichDomain(domain) {
        assertDomain(domain);

        return apiRequest(TARGET, ApiEndpoints.leads.enrich(domain.trim()), {
            auth: false
        });
    },

    importDomain(domain) {
        assertDomain(domain);

        return apiRequest(TARGET, ApiEndpoints.leads.import(domain.trim()), {
            method: "POST",
            auth: true
        });
    },

    getDetails(id) {
        assertId(id);

        return apiRequest(TARGET, ApiEndpoints.leads.details(id), {
            auth: false
        });
    },

    assign(leadId, userId) {
        assertId(leadId);
        assertId(userId);

        return apiRequest(TARGET, ApiEndpoints.leads.assign(leadId), {
            method: "PATCH",
            auth: true,
            body: { userId }
        });
    }
});

function assertDomain(domain) {
    if (typeof domain !== "string" || domain.trim() === "") {
        throw new Error("Domain must be a non-empty string.");
    }
}

function assertId(id) {
    if (typeof id !== "string" || id.trim() === "") {
        throw new Error("Id must be a non-empty string.");
    }
}