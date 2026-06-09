import { leadApi } from "../Endpoints/leadApi.js";

export class LeadService {
    constructor({ leadApi: api = leadApi, leadStore }) {
        if (!leadStore) {
            throw new Error("LeadService requires a leadStore.");
        }

        this.leadApi = api;
        this.leadStore = leadStore;
    }

    #normalizeQuery(query = {}) {
        const page = Number(query.page ?? 1);
        const pageSize = Number(query.pageSize ?? 20);

        return {
            page: Number.isInteger(page) && page > 0 ? page : 1,
            pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 20,
            search: String(query.search ?? ""),
            sortBy: String(query.sortBy ?? "created"),
            sortOrder: String(query.sortOrder ?? "desc")
        };
    }

    async loadLeads(query = {}) {
        const normalizedQuery = this.#normalizeQuery(query);
        const response = await this.leadApi.getAll(normalizedQuery);

        const leads = Array.isArray(response)
            ? response
            : response?.items
              ?? response?.Items
              ?? response?.data
              ?? response?.Data
              ?? [];

        const paging = {
            page:
                response?.page
                ?? response?.currentPage
                ?? response?.CurrentPage
                ?? normalizedQuery.page,

            pageSize:
                response?.pageSize
                ?? response?.PageSize
                ?? normalizedQuery.pageSize,

            totalCount:
                response?.totalCount
                ?? response?.TotalCount
                ?? leads.length,

            totalPages:
                response?.totalPages
                ?? response?.TotalPages
                ?? 1
        };

        this.leadStore.setMany(leads, paging);

        return this.leadStore.getAll();
    }

    getLeads() {
        return this.leadStore.getAll();
    }

    getLeadById(id) {
        return this.leadStore.getById(id);
    }

    searchLeads(searchTerm = "") {
        return this.leadStore.search(searchTerm);
    }

    getPaging() {
        return this.leadStore.getPaging();
    }

    async enrichDomain(domain) {
        const enriched = await this.leadApi.enrichDomain(domain);

        if (enriched?.id || enriched?.leadId || enriched?.Id || enriched?.LeadId) {
            this.leadStore.upsert(enriched);
        }

        return enriched;
    }

    async importDomain(domain) {
        const imported = await this.leadApi.importDomain(domain);

        if (imported?.id || imported?.leadId || imported?.Id || imported?.LeadId) {
            this.leadStore.upsert(imported);
        }

        return imported;
    }

    async getLeadDetails(id) {
        const details = await this.leadApi.getDetails(id);

        if (details?.id || details?.leadId || details?.Id || details?.LeadId) {
            this.leadStore.upsert(details);
        }

        return details;
    }

    async assignLead(leadId, userId) {
        const assigned = await this.leadApi.assign(leadId, userId);

        if (assigned?.id || assigned?.leadId || assigned?.Id || assigned?.LeadId) {
            this.leadStore.upsert(assigned);
        }

        return assigned;
    }
}