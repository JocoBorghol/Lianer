import { activityApi } from "../Endpoints/activityApi.js";


/**
 * This class holds the currently fetched Activities.
 * Only read-functions and no API calls from here.
 * Its sole purpose is to hold activities and notify ViewModels using the instance.
 * 
 * So it holds data in a Map, has optimized filter functionality,
 * acts as a global context for viewmodels. And it adds a second layer of
 * subscription to the UI. 
 * 
 * The main "win" by adding the second subscription layer is that
 * the data changes occuring outside of a ViewModels scope will now
 * still alert that ViewModel. Since data is shared by instance
 * and not refetched during navigation, this helps creating consistency between
 * viewmodels in the lifecycle. 
 * Its also pretty nice to have a read-only class since it elevates
 * our seperation of concerns. 
 */

export class ActivityStore{

    /**
     * The "cached" Activities are stored in a Map. 
     * Maps are faster than arrays when it comes for
     * specific lookups.
     */
    #activitiesById = new Map();
    #listeners = new Set();

    setMany(activities = []) {
        this.#activitiesById.clear();

        activities.forEach(activity => {
            if (!activity?.id) return;
            this.#activitiesById.set(activity.id, activity);
        });

        this.#notify();
    }

    upsert(activity) {
        if (!activity?.id) return;

        this.#activitiesById.set(activity.id, activity);
        this.#notify();
    }

    remove(id) {
        if (!id) return;

        this.#activitiesById.delete(id);
        this.#notify();
    }

    clearCache() {
        this.#activitiesById.clear();
        this.#notify();
    }

    getAll() {
        return Array.from(this.#activitiesById.values());
    }

    getById(id) {
        if (!id) return null;
        return this.#activitiesById.get(id) ?? null;
    }

    byStatus(status) {
        return this.getAll().filter(activity => activity.status === status);
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #notify() {
        this.#listeners.forEach(listener => listener());
    }
// doublr linked list för ui
//  


}
 


/*
    möjliga mönster.

    1. 
    -> skickar till
    <-> får och skickar
    <- får av

    - UI skickar via VM och får data från VM
    UI <-> ViewModel
    
    - VM får av store
    ViewModel <- Store 

    - VM skickar till Service enbart
    ViewModel -> Service 

    - store får av service
    Store <- Service 

    antingen 
    
    VM får data av Service och skickar till Service
    eller
    VM får data av Store och skickar till Service

    Fördelar med nm 2: 

    Om store även har notify/subscribe, då
    hmm okej kan vi ta en brutal ärlig reflektion ?



antinen kör vi : 

1: UI till VM till Service till Store 

eller

2: UI till VM till Service 



i 1: 
Store håller data, Service uppdaterar store.
Store har även funktionalitet för att notifiera
sina "barn" om sin egna data uppdateras

fråga: 
UI ska subscribe på ViewModel. 
Är det en fördel eller nackdel att ViewModel också 
är subscribes till sina Stores? 
ViewModels håller ofta delad data (alltså från flera stores i detta fall).
Om något ändras i UI är et ju egentloigen bara VM som behöver
ändra detta och skicka till Service och få ny lista. 
Finns det någon fördel jag inte kommit fram till med
att store skulle också notify VM? 

t.ex om VM har UserStore, ActivityStore. 
Och en ändring sker i UserStore, då kommer alla viewmodels
få uppdatering om att User data ändrats. 





 * 
 */