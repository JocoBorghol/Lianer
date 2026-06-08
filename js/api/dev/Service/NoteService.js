import { noteApi } from "../Endpoints/noteApi.js";

export class NoteService 
{
    constructor(api = noteApi) 
    {
        this.api = api;
        this.notesByActivityId = new Map();
    }


    getNotesForActivity(activityId) 
    {
        const notes = this.notesByActivityId.get(activityId);
        if (!notes) return [];

        return Array.from(notes.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getNoteById(activityId, noteId) 
    {
        const notes = this.notesByActivityId.get(activityId);
        if (!notes) return null;

        return notes.get(noteId) ?? null;
    }

    /* All async calls to api  */
    async fetchNoteById(activityId, noteId) 
    {
        const note = await this.api.getById(activityId, noteId);
        this.#upsertNote(activityId, note);
        return note;
    }

    async createNote(activityId, requestBody) 
    {
        const created = await this.api.create(activityId, requestBody);
        this.#upsertNote(activityId, created);
        return created;
    }

    async updateNote(activityId, noteId, requestBody) 
    {
        const updated = await this.api.update(activityId, noteId, requestBody);
        this.#upsertNote(activityId, updated);
        return updated;
    }

    async deleteNote(activityId, noteId) 
    {
        await this.api.delete(activityId, noteId);

        const notes = this.notesByActivityId.get(activityId);
        if (notes) {
            notes.delete(noteId);
        }

        return true;
    }

    async loadNotesForActivity(activityId, paging = {}) 
    {
        const notes = await this.api.getByActivityId(activityId, paging);
        const safeNotes = Array.isArray(notes) ? notes : [];

        const activityNotes = new Map();

        safeNotes.forEach(note => {
            if (!note || !note.id) return;
            activityNotes.set(note.id, note);
        });

        this.notesByActivityId.set(activityId, activityNotes);

        return this.getNotesForActivity(activityId);
    }

    clearActivityCache(activityId) 
    {
        this.notesByActivityId.delete(activityId);
    }

    clearCache() 
    {
        this.notesByActivityId.clear();
    }

    #upsertNote(activityId, note) 
    {
        if (!note || !note.id) return;

        if (!this.notesByActivityId.has(activityId)) {
            this.notesByActivityId.set(activityId, new Map());
        }

        this.notesByActivityId.get(activityId).set(note.id, note);
    }
}