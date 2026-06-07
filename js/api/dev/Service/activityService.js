import { activityApi } from "../Endpoints/activityApi";

export class ActivityService{
    constructor(api = activityApi){
        this.api = api;
        this.activities = new Map();
    }

    async init(paging = {}){
        await this.loadActivities(paging);

    }

    async loadActivities(paging = {})
    {
        const response = await this.api.getAll(paging);
        this.activities.clear();
        const data = Array.isArray(response) ? response : [];
        data.forEach(activity=> {
            if (!activity || !activity.id) return;
            this.activities.set(activity.id, activity);
            
        });
        return this.getActivities();
    }

    getActivities() {
        return Array.from(this.activities.values());
    }

    getActivityById(id) {
        return this.activities.get(id) ?? null;
    }

    byStatus(status) {
        return this.getActivities().filter(activity => activity.status === status);
    }

    async createActivity(requestBody)
    {
        const created = await this.api.create(requestBody);
        if (created && created.id) {
            this.activities.set(created.id, created);
        }
        return created;
    }

    async updateActivity(requestBody)
    {
        const updated = await this.api.update(requestBody);
        if (updated && updated.id) {
            this.activities.set(updated.id, updated);
        }
        return updated;
    }

    async deleteActivity(id) {
        await this.api.delete(id);
        this.activities.delete(id);
        return true;
    }

    clearCache() {
        this.activities.clear();
    }

}