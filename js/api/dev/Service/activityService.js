import { activityApi } from "../Endpoints/activityApi.js";

export class ActivityService {
    constructor({ activityApi: api = activityApi, activityStore }) {
        this.activityApi = api;
        this.activityStore = activityStore;
    }

    /**
     * Its important paging is mapped correctly to our backend. 
     * So this helper normalizes and also ensures both values exist.
     * @param {object containing current pagenumber and pagesize} paging 
     * @returns {currentPage, pageSize}
     */
    #normalizePaging(paging={}){
        const currentPage = Number(paging.currentPage ?? 1);
        const pageSize = Number(paging.pageSize ?? 20);

        return {
            currentPage: Number.isInteger(currentPage) && currentPage > 0
                ? currentPage
                : 1,

            pageSize: Number.isInteger(pageSize) && pageSize > 0
                ? pageSize
                : 20
            }
    }

    /**
     * 
     * @param {paging} 
     * @returns 
     */
    async loadActivities(paging = {}) {
        const normalizedPaging = this.#normalizePaging(paging);
        const response = await this.activityApi.getAll(normalizedPaging);

        const activities = Array.isArray(response)
            ? response
            : response?.items ?? [];

        this.activityStore.setMany(activities);

        return this.activityStore.getAll();
    }


    getActivities() {
        return this.activityStore.getAll();
    }

    getActivityById(id) {
        return this.activityStore.getById(id);
    }


    async updateActivity(requestBody) {
        const updated = await this.activityApi.update(requestBody);

        if (updated?.id) {
            this.activityStore.upsert(updated);
        }

        return updated;
    }

    async deleteActivity(id) 
    {
        await this.activityApi.delete(id);
        this.activityStore.remove(id);
        return true;
    }

    async createActivity(requestBody) 
    {
        const created = await this.activityApi.create(requestBody);
        if (created?.id) {
            this.activityStore.upsert(created);
        }
        return created;
    }
}