import { loadState, saveState } from "../storage.js";

export class TaskRepo 
{
    load(){
        const state = loadState();
        return Array.isArray(state.tasks) ? state.tasks : [];
    }

    save(tasks){
        const state= loadState();
        state.tasks = Array.isArray(tasks) ? tasks : [];
        saveState(state);
    }

    clear(){
        const state = loadState();
        state.tasks = [];
        saveState(state);
    }
}
