import { TASK_STATUSES } from "../status.js";
export class CalendarViewModel {
    #taskScreenViewModel;

    #isLoaded = false;
    #isLoading = false;
    #error = null;

    constructor({ taskScreenViewModel }) {
        this.#taskScreenViewModel = taskScreenViewModel;
    }

    async init() {
        if (this.#isLoaded || this.#isLoading) return;

        this.#isLoading = true;
        this.#error = null;

        try {
            /*
              

              TODO FIX THIS
            */
            await this.#taskScreenViewModel.init();
            this.#isLoaded = true;
        } catch (error) {
            console.error("CalendarViewModel failed to load:", error);
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
        return this.#taskScreenViewModel.getPeople();
    }

    getTasks() {
        return this.#taskScreenViewModel
            .getTasks()
            .filter(task => task.status !== TASK_STATUSES.CLOSED);
    }

    getTasksForFilter(calendarFilter) {
        const tasks = this.getTasks();

        if (calendarFilter === "Alla") {
            return tasks;
        }

        return tasks.filter(task => {
            if (Array.isArray(task.assignedTo) && task.assignedTo.includes(calendarFilter)) {
                return true;
            }

            return task.assigned === calendarFilter;
        });
    }

    getTasksForDate(dateStr, calendarFilter = "Alla") {
        return this.getTasksForFilter(calendarFilter)
            .filter(task => task.deadline === dateStr);
    }

    getTaskServiceAdapter() {
        return this.#taskScreenViewModel.getTaskServiceAdapter();
    }

    getExportTasks() {
        return this.getTasks();
    }
}