export class LeadStore {
    #leadsById = new Map();
    #listeners = new Set();
    #paging = {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0
    };

    setMany(leads = [], paging = {}) {
        this.#leadsById.clear();

        leads.forEach(lead => {
            const id = this.#getLeadId(lead);
            if (!id) return;

            this.#leadsById.set(id, lead);
        });

        this.#paging = {
            ...this.#paging,
            ...paging
        };

        this.#notify();
    }

    upsert(lead) {
        const id = this.#getLeadId(lead);
        if (!id) return;

        this.#leadsById.set(id, lead);
        this.#notify();
    }

    remove(id) {
        if (!id) return;

        this.#leadsById.delete(id);
        this.#notify();
    }

    clearCache() {
        this.#leadsById.clear();
        this.#paging = {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0
        };

        this.#notify();
    }

    getAll() {
        return Array.from(this.#leadsById.values());
    }

    getById(id) {
        if (!id) return null;

        return this.#leadsById.get(id) ?? null;
    }

    getPaging() {
        return { ...this.#paging };
    }

    search(searchTerm = "") {
        const q = String(searchTerm).trim().toLowerCase();

        if (!q) {
            return this.getAll();
        }

        return this.getAll().filter(lead => {
            const values = [
                lead.domain,
                lead.Domain,
                lead.company,
                lead.Company,
                lead.name,
                lead.Name,
                lead.email,
                lead.Email,
                lead.status,
                lead.Status
            ];

            return values
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(q));
        });
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #notify() {
        this.#listeners.forEach(listener => listener());
    }

    #getLeadId(lead) {
        return lead?.id ?? lead?.leadId ?? lead?.Id ?? lead?.LeadId ?? null;
    }
}