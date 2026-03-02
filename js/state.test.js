import { getTasks, loadState, addState, removeById, saveState } from "../js/storage.js";
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe("state management", () => {

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();

    jest.unstable_mockModule("../js/observer.js", () => ({
      notify: jest.fn()
    }));
  });

  afterEach(() => { jest.clearAllMocks(); });

  test("loadstate should return default state if empty", () => {
    const state = loadState();
    expect(state.tasks).toEqual([]);
    expect(state.people).toEqual(["Ingen", "Person 1", "Person 2"]);
  });

  test("loadstate should return state", () => {
    localStorage.setItem("state", JSON.stringify({ tasks: [{ id: 1 }], people: [] }));
    const state = loadState();
    expect(state.tasks.length).toBe(1);
  });

  test("should call localstorage setItem on save", () => {
    jest.spyOn(Storage.prototype, 'setItem');
    const state = { tasks: [{ id: 1 }], people: [] };
    saveState(state);
    expect(localStorage.setItem).toHaveBeenCalledWith("state", JSON.stringify(state));
  });

  test("should add task to localstorage", () => {
    addState({ id: 1, title: "Test" });
    const tasks = getTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe("Test");
  });

  test("should add remove task by id", () => {
    addState({ id: 1 });
    addState({ id: 2 });
    removeById(1);
    const tasks = getTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(2);
  });

  test("should handle non-array tasks in addState", () => {
    localStorage.setItem("state", JSON.stringify({ tasks: "Wait, this is not an array!", people: [] }));
    addState({ id: 99, title: "Recovery Task" });
    const tasks = getTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(99);
  });

  test("should handle non-array tasks in getTasks", () => {
    localStorage.setItem("state", JSON.stringify({ tasks: null, people: [] }));
    const tasks = getTasks();
    expect(tasks).toEqual([]);
  });

});