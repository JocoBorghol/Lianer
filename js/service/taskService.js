/* ==========================================================================
    TaskService - Hanterar logik, lagring och ordning för uppgifter.
   ========================================================================== */

export class TaskService {
    constructor(repo) {
        this.repo = repo;
        this.tasks = new Map();
        this.dirtyIds = new Set();
        this.changed = new Map();
    }

    _generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    _exists(id) {
        return this.tasks.has(id);
    }

    _save() {
        const array = Array.from(this.tasks.values());
        this.repo.save(array);
    }

    _load() {
        const data = this.repo.load() || [];
        data.forEach(task => {
            // Säkerställ att gamla tasks också får en notes-array
            if (!task.notes) task.notes = [];
            this.tasks.set(task.id, task);
        });
    }

    _filter(k, v) {
        return Array.from(this.tasks.values())
            .filter(t => t[k] === v);
    }

    init() {
        this._load();
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    getTaskById(id) {
        const t = this.tasks.get(id);
        if (!t) return null;
        return t;
    }

    updateTask(updatedTask) {
        if (!updatedTask || updatedTask.id == null) return null;
        if (!this._exists(updatedTask.id)) return null;

        // Behåll existerande notes om de inte skickas med i uppdateringen
        const existingTask = this.getTaskById(updatedTask.id);
        if (!updatedTask.notes) updatedTask.notes = existingTask.notes || [];

        this.tasks.set(updatedTask.id, updatedTask);
        this.changed.set(updatedTask.id, updatedTask);
        this._save();
        return updatedTask;
    }

    deleteTask(id) {
        if (!id) return null;
        const task = this.getTaskById(id);
        if (!task) return null;

        this.tasks.delete(id);
        this._save();
        return task;
    }

    addTask(task) {
        if (!task) return null;
        if (this._exists(task.id)) return null;

        if (!task.id) task.id = this._generateId();
        
        // INITIALISERA HISTORIK: Viktigt för att undvika krascher i tester/UI
        if (!task.notes) task.notes = [];

        this.getLatestOrderId(task);
        this.tasks.set(task.id, task);
        this._save();
        return task;
    }

    byStatus(status) {
        return this._filter("status", status);
    }

    changeStatus(id, newStatus) {
        if (!id || !newStatus) return null;
        const task = this.getTaskById(id);
        if (!task) return null;

        if (task.status === newStatus) return task;

        // SPARA HISTORIK VID STATUSÄNDRING
        if (!task.notes) task.notes = [];
        task.notes.push({
            type: "status_change",
            from: task.status,
            to: newStatus,
            date: new Date().toISOString(),
            text: `Status ändrad från ${task.status} till ${newStatus}`
        });

        task.status = newStatus;
        this.getLatestOrderId(task);
        this.tasks.set(task.id, task);
        this.changed.set(task.id, task);
        this._save();
        return task;
    }

    /* Metod för att flytta en task med en obligatorisk kommentar 
       Används t.ex. när man stänger en uppgift via X-knappen.
    */
    closeTaskWithReason(id, reason) {
        const task = this.getTaskById(id);
        if (!task || !reason) return null;

        if (!task.notes) task.notes = [];
        task.notes.push({
            type: "closure",
            text: reason,
            date: new Date().toISOString()
        });

        return this.changeStatus(id, "Klar");
    }

    updateTaskOrder(taskId, newStatus, prevOrderId, nextOrderId) {
        const task = this.getTaskById(taskId);
        if (!task) return null;

        task.status = newStatus;

        const tasksInColumn = this.byStatus(newStatus)
            .filter(t => t.id !== taskId)
            .sort((a, b) => this._compareRank(a.order || "", b.order || ""));

        let insertIndex = tasksInColumn.length;
        if (nextOrderId) {
            const nextIndex = tasksInColumn.findIndex(t => t.id === nextOrderId);
            if (nextIndex !== -1) insertIndex = nextIndex;
        } else if (prevOrderId) {
            const prevIndex = tasksInColumn.findIndex(t => t.id === prevOrderId);
            if (prevIndex !== -1) insertIndex = prevIndex + 1;
        }

        tasksInColumn.splice(insertIndex, 0, task);

        let currentRank = "J";
        for (let i = 0; i < tasksInColumn.length; i++) {
            const t = tasksInColumn[i];
            if (t.order !== currentRank) {
                t.order = currentRank;
                this.tasks.set(t.id, t);
                this.changed.set(t.id, t);
            }
            currentRank = this._genOrderId(currentRank);
        }

        this.tasks.set(task.id, task);
        this.changed.set(task.id, task);
        this._save();
        return task;
    }

    clearTasks() {
        this.tasks.clear();
        this.changed.clear();
        this.dirtyIds.clear();
        this._save();
    }

    importDemoTasks(tasksArray) {
        this.clearTasks();
        if (Array.isArray(tasksArray)) {
            tasksArray.forEach(t => {
                if (!t.notes) t.notes = [];
                this.getLatestOrderId(t);
                this.tasks.set(t.id, t);
            });
            this._save();
        }
    }

    byAssigned(assigned) {
        return this._filter("assigned", assigned);
    }

    getLatestOrderId(task) {
        const startingPoint = "J";
        const tasks = this.byStatus(task.status);
        if (tasks.length === 0) {
            task.order = startingPoint;
        } else {
            const sorted = [...tasks].sort((a, b) => this._compareRank(a.order, b.order));
            const lastTask = sorted.pop();
            task.order = this._genOrderId(lastTask.order || startingPoint);
        }
    }

    _compareRank(a = "", b = "") {
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        if (a.length !== b.length) return a.length - b.length;
        for (let i = 0; i < a.length; i++) {
            const ai = ALPHABET.indexOf(a[i]);
            const bi = ALPHABET.indexOf(b[i]);
            if (ai !== bi) return ai - bi;
        }
        return 0;
    }

    getTasksByStatus(status) {
        return this.byStatus(status)
            .sort((a, b) => this._compareRank(a.order || "", b.order || ""));
    }

    moveTask(id, direction) {
        if (!id) return null;
        const task = this.getTaskById(id);
        if (!task) return null;

        const sameStatus = this.byStatus(task.status)
            .sort((a, b) => this._compareRank(a.order || "", b.order || ""));

        const index = sameStatus.findIndex(t => t.id === id);
        if (index === -1) return null;

        const targetIndex = direction === "up" ? index - 1 : direction === "down" ? index + 1 : -1;
        if (targetIndex < 0 || targetIndex >= sameStatus.length) return task;
        
        const target = sameStatus[targetIndex];
        if (!target) return task;

        const temp = task.order;
        task.order = target.order;
        target.order = temp;

        this.tasks.set(task.id, task);
        this.tasks.set(target.id, target);
        this.changed.set(task.id, task);
        this.changed.set(target.id, target);

        this._save();
        return task;
    }

    _genOrderId(currentRank) {
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let letters = currentRank.split('');

        for (let i = letters.length - 1; i >= 0; i--) {
            let charI = ALPHABET.indexOf(letters[i]);
            if (charI < ALPHABET.length - 1) {
                letters[i] = ALPHABET[charI + 1];
                return letters.join('');
            } else {
                letters[i] = ALPHABET[0];
            }
        }
        return ALPHABET[0] + letters.join('');
    }
}