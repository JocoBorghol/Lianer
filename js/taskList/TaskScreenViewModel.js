import { TASK_STATUSES } from "../status.js";
import { notify } from "../observer.js";
const API_STATUS_TO_UI_STATUS = Object.freeze({
    0: TASK_STATUSES.TODO,
    1: TASK_STATUSES.IN_PROGRESS,
    2: TASK_STATUSES.DONE,
    3: TASK_STATUSES.CLOSED,
    4: TASK_STATUSES.TODO
});

const UI_STATUS_TO_API_STATUS = Object.freeze({
    [TASK_STATUSES.TODO]: 0,
    [TASK_STATUSES.IN_PROGRESS]: 1,
    [TASK_STATUSES.DONE]: 2,
    [TASK_STATUSES.CLOSED]: 3
});

export class TaskScreenViewModel {
    #activityService;
    #userService;

    #users = [];
    #isLoaded = false;
    #isLoading = false;
    #error = null;

    constructor({ activityService, userService = null }) {
        this.#activityService = activityService;
        this.#userService = userService;
    }

    async init() {
        if (this.#isLoaded || this.#isLoading) return;

        this.#isLoading = true;
        this.#error = null;

        try {
            await this.#activityService.loadActivities({
                currentPage: 1,
                pageSize: 100
            });

            if (this.#userService?.loadUsers) {
                this.#users = await this.#userService.loadUsers();
            }

            this.#isLoaded = true;
        } catch (error) {
            console.error("TaskScreenViewModel failed to load:", error);
            this.#error = error;
        } finally {
            this.#isLoading = false;
        }
    }

    getState() {
        return {
            isLoaded: this.#isLoaded,
            isLoading: this.#isLoading,
            error: this.#error
        };
    }

    getPeople() {
        const names = this.#users
            .map(user =>
                user.fullName
                ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            )
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "sv-SE"));

        return ["Ingen", ...names];
    }

    getTasks() {
        return this.#activityService
            .getActivities()
            .map((activity, index) => this.#toTaskCardShape(activity, index));
    }

    getVisibleTasks(selectedFilter) {
        const tasks = this.getTasks();

        if (selectedFilter === "Team" || selectedFilter === "Arkiv") {
            return tasks;
        }

        if (selectedFilter === "Ingen") {
            return tasks.filter(task =>
                !task.assignedTo || task.assignedTo.length === 0
            );
        }

        return tasks.filter(task =>
            task.assignedTo?.includes(selectedFilter) ||
            task.assigned === selectedFilter
        );
    }

getTaskServiceAdapter() {
    return {
        getTasks: () => this.getTasks(),

        getTaskById: (id) => {
            return this.getTasks().find(task => task.id === id) ?? null;
        },

        _compareRank: (a = "", b = "") => {
            return String(a).localeCompare(String(b), "sv-SE", {
                numeric: true,
                sensitivity: "base"
            });
        },

        addTask: async (taskDraft) => {
            const created = await this.#activityService.createActivity(
                this.#toCreateActivityRequest(taskDraft)
            );

            notify();

            return created?.id
                ? this.#toTaskCardShape(created, this.getTasks().length)
                : created;
        },

        updateTask: async (updatedTask) => {
            const activity = this.#activityService.getActivityById(updatedTask.id);
            if (!activity) return null;

            const updated = await this.#activityService.updateActivity(
                this.#toUpdateActivityRequest(updatedTask, activity)
            );

            notify();

            return updated?.id
                ? this.#toTaskCardShape(updated, 0)
                : updated;
        },

        changeStatus: async (id, newStatus) => {
            const activity = this.#activityService.getActivityById(id);
            if (!activity) return null;

            const updated = await this.#activityService.updateActivity({
                id: activity.id,
                description: activity.description ?? null,
                assignedTo: activity.assignedTo ?? null,
                startDate: activity.startDate ?? null,
                endDate: activity.endDate ?? null,
                status: UI_STATUS_TO_API_STATUS[newStatus] ?? activity.status
            });

            notify();

            return updated;
        },

        updateTaskOrder: async (id, newStatus) => {
            const activity = this.#activityService.getActivityById(id);
            if (!activity) return null;

            const updated = await this.#activityService.updateActivity({
                id: activity.id,
                description: activity.description ?? null,
                assignedTo: activity.assignedTo ?? null,
                startDate: activity.startDate ?? null,
                endDate: activity.endDate ?? null,
                status: UI_STATUS_TO_API_STATUS[newStatus] ?? activity.status
            });

            notify();

            return updated;
        },

        moveTask: () => {
            // Later: real board ordering / sortKey.
            return null;
        },

        closeTaskWithReason: async (id) => {
            const activity = this.#activityService.getActivityById(id);
            if (!activity) return null;

            const updated = await this.#activityService.updateActivity({
                id: activity.id,
                description: activity.description ?? null,
                assignedTo: activity.assignedTo ?? null,
                startDate: activity.startDate ?? null,
                endDate: activity.endDate ?? null,
                status: UI_STATUS_TO_API_STATUS[TASK_STATUSES.CLOSED]
            });

            notify();

            return updated;
        },

        deleteTask: async (idOrTask) => {
            const id = typeof idOrTask === "object"
                ? idOrTask.id
                : idOrTask;

            const deleted = await this.#activityService.deleteActivity(id);

            notify();

            return deleted;
        }
    };
}

    #toTaskCardShape(activity, index) {
        const status = API_STATUS_TO_UI_STATUS[activity.status] ?? TASK_STATUSES.TODO;
        const assignedName = this.#getAssignedName(activity.assignedTo);

        return {
            id: activity.id,

            title:
                activity.title
                ?? this.#titleFromDescription(activity.description)
                ?? `Aktivitet ${index + 1}`,

            description: activity.description ?? "Ingen beskrivning.",
            status,

            createdAt: activity.createdAt ?? new Date().toISOString(),
            deadline: this.#toDateOnly(activity.endDate),

            assigned: assignedName,
            assignedTo: assignedName === "Ingen" ? [] : [assignedName],

            completed: status === TASK_STATUSES.DONE || status === TASK_STATUSES.CLOSED,

            notes: [],
            contactId: activity.contactId ?? null,
            contactName: activity.contactName ?? null,

            priority: activity.priority ?? "",
            taskType: activity.taskType ?? "",
            taskTime: this.#toTaskTime(activity.startDate, activity.endDate),

            order:
                activity.sortKey
                ?? activity.order
                ?? String(index).padStart(6, "0"),

            rawActivity: activity
        };
    }

    #getAssignedName(userId) {
        if (!userId) return "Ingen";

        const user = this.#users.find(user =>
            user.userId === userId || user.id === userId
        );

        if (!user) {
            return `Användare ${String(userId).slice(0, 8)}`;
        }

        return user.fullName
            ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            ?? "Okänd användare";
    }

    #titleFromDescription(description) {
        if (!description) return null;

        const text = String(description).trim();
        if (!text) return null;

        return text.length > 4
            ? `${text.slice(0, 4)}...`
            : text;
    }

    #toDateOnly(value) {
        if (!value) return 0;

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 0;

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    #toTaskTime(startDate, endDate) {
        if (!startDate) return null;

        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) return null;

        const result = {
            start: this.#toTime(start)
        };

        if (endDate) {
            const end = new Date(endDate);

            if (!Number.isNaN(end.getTime())) {
                result.end = this.#toTime(end);
            }
        }

        return result;
    }

    #toTime(date) {
        return [
            String(date.getHours()).padStart(2, "0"),
            String(date.getMinutes()).padStart(2, "0")
        ].join(":");
    }

    #toCreateActivityRequest(taskDraft = {}) {
    return {
        title: taskDraft.title ?? null,

        description:
            taskDraft.description
            ?? taskDraft.title
            ?? "Ny aktivitet",

        assignedTo: this.#getAssignedUserIdFromTask(taskDraft),

        startDate: this.#toStartDateTime(taskDraft),
        endDate: this.#toEndDateTime(taskDraft),

        status:
            UI_STATUS_TO_API_STATUS[taskDraft.status]
            ?? UI_STATUS_TO_API_STATUS[TASK_STATUSES.TODO]
    };
}

#toUpdateActivityRequest(updatedTask = {}, existingActivity = {}) {
    return {
        id: existingActivity.id,

        title:
            updatedTask.title
            ?? existingActivity.title
            ?? null,

        description:
            updatedTask.description
            ?? existingActivity.description
            ?? "Uppdaterad aktivitet",

        assignedTo: this.#getAssignedUserIdFromTask(updatedTask),

        startDate:
            this.#toStartDateTime(updatedTask)
            ?? existingActivity.startDate
            ?? null,

        endDate:
            this.#toEndDateTime(updatedTask)
            ?? existingActivity.endDate
            ?? null,

        status:
            UI_STATUS_TO_API_STATUS[updatedTask.status]
            ?? existingActivity.status
            ?? null
    };
}

#getAssignedUserIdFromTask(task = {}) {
    const assignedName =
        task.assigned
        ?? task.assignedTo?.find(name => name && name !== "Ingen")
        ?? null;

    if (!assignedName || assignedName === "Ingen") {
        return null;
    }

    const user = this.#users.find(user => {
        const fullName =
            user.fullName
            ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

        return fullName === assignedName;
    });

    return user?.userId ?? user?.id ?? null;
}

#toStartDateTime(task = {}) {
    if (!task.deadline || task.deadline === 0) {
        return null;
    }

    const startTime =
        task.taskTime?.start
        ?? (typeof task.taskTime === "string" ? task.taskTime : null)
        ?? null;

    if (!startTime) {
        return null;
    }

    return this.#toIsoDateTime(task.deadline, startTime);
}

#toEndDateTime(task = {}) {
    if (!task.deadline || task.deadline === 0) {
        return null;
    }

    const endTime =
        task.taskTime?.end
        ?? null;

    if (endTime) {
        return this.#toIsoDateTime(task.deadline, endTime);
    }

    return this.#toIsoDateTime(task.deadline, "12:00");
}

#toIsoDateTime(dateOnly, time) {
    if (!dateOnly || !time) return null;

    const date = new Date(`${dateOnly}T${time}:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}
}