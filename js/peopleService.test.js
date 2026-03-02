import { jest } from '@jest/globals';
import { getPeople, addPerson, renamePerson } from '../js/people/peopleService.js';
import { loadState, saveState } from '../js/storage.js';
import { subscribe } from '../js/observer.js';

let store = {};
global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
        store[key] = value;
    },
    clear: () => {
        store = {};
    }
};

let notifyCount = 0;
subscribe(() => {
    notifyCount++;
});

describe('peopleService', () => {
    beforeEach(() => {
        store = {};
        notifyCount = 0;
    });

    describe('getPeople', () => {
        it('should return default people if state has no people', () => {
            saveState({});
            const people = getPeople();
            expect(people).toEqual(["Ingen", "Person 1", "Person 2"]);
        });

        it('should return default people if state is null', () => {
            global.localStorage.getItem = jest.fn(() => null);
            const people = getPeople();
            expect(people).toEqual(["Ingen", "Person 1", "Person 2"]);
            global.localStorage.getItem = (key) => store[key] || null;
        });

        it('should return saved people and ensure "Ingen" is present', () => {
            saveState({ people: ["Alice", "Bob"] });
            const people = getPeople();
            expect(people).toEqual(["Ingen", "Alice", "Bob"]);
        });

        it('should not add duplicate "Ingen" if already present', () => {
            saveState({ people: ["Ingen", "Alice"] });
            const people = getPeople();
            expect(people).toEqual(["Ingen", "Alice"]);
        });
    });

    describe('addPerson', () => {
        it('should do nothing if name is empty', () => {
            addPerson('');
            expect(store['state']).toBeUndefined();
            expect(notifyCount).toBe(0);
        });

        it('should do nothing if name is "Ingen"', () => {
            addPerson('Ingen');
            expect(store['state']).toBeUndefined();
            expect(notifyCount).toBe(0);
        });

        it('should do nothing if person already exists', () => {
            saveState({ people: ["Alice"] });
            const preSave = store['state'];
            notifyCount = 0; // reset after setup

            addPerson('Alice');
            expect(store['state']).toBe(preSave);
            expect(notifyCount).toBe(0);
        });

        it('should add person to existing people', () => {
            saveState({ people: ["Alice"] });
            notifyCount = 0; // reset after setup

            addPerson('Bob');

            const state = loadState();
            expect(state.people).toEqual(["Alice", "Bob"]);
            expect(notifyCount).toBe(2); // saveState + direct notify
        });

        it('should add person to default people if no state people exist', () => {
            saveState({});
            notifyCount = 0; // reset after setup

            addPerson('Bob');

            const state = loadState();
            expect(state.people).toEqual(["Person 1", "Person 2", "Bob"]);
            expect(notifyCount).toBe(2);
        });
    });

    describe('renamePerson', () => {
        it('should do nothing if newName is empty', () => {
            saveState({ people: ["Person 1"] });
            const preSave = store['state'];
            notifyCount = 0; // reset after setup

            renamePerson('Person 1', '');
            expect(store['state']).toBe(preSave);
            expect(notifyCount).toBe(0);
        });

        it('should do nothing if oldName is "Ingen"', () => {
            saveState({ people: ["Ingen", "Person 1"] });
            const preSave = store['state'];
            notifyCount = 0;

            renamePerson('Ingen', 'Bob');
            expect(store['state']).toBe(preSave);
            expect(notifyCount).toBe(0);
        });

        it('should do nothing if state has no people', () => {
            saveState({});
            const preSave = store['state'];
            notifyCount = 0;

            renamePerson('Person 1', 'Bob');
            expect(store['state']).toBe(preSave);
            expect(notifyCount).toBe(0);
        });

        it('should rename a person', () => {
            saveState({ people: ["Person 1", "Person 2"] });
            notifyCount = 0;

            renamePerson('Person 1', 'Bob');

            const state = loadState();
            expect(state.people).toEqual(["Bob", "Person 2"]);
            expect(notifyCount).toBe(2);
        });

        it('should update assigned tasks when a person is renamed', () => {
            saveState({
                people: ["Alice", "Bob"],
                tasks: [
                    { id: 1, title: "Task 1", assigned: "Alice" },
                    { id: 2, title: "Task 2", assigned: "Bob" }
                ]
            });
            notifyCount = 0;

            renamePerson('Alice', 'Charlie');

            const state = loadState();
            expect(state.people).toEqual(["Charlie", "Bob"]);
            expect(state.tasks).toEqual([
                { id: 1, title: "Task 1", assigned: "Charlie" },
                { id: 2, title: "Task 2", assigned: "Bob" }
            ]);
            expect(notifyCount).toBe(2);
        });
    });
});
