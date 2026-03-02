import { describe, test, expect } from "@jest/globals";


import {
  TASK_STATUSES,
  isValidTaskStatus,
  requiresCommentForStatus,
  updateTaskStatus
} from "../js/status.js";

import { loadState, saveState } from "../js/storage.js";




let store = {};
global.localStorage =
{
  getItem: (key) => store[key] || null,
  setItem: (key, value) => {
    store[key] = value;
  },
  clear: () => {
    store = {};
  }
};

beforeEach(() => {
  store = {};

  saveState({
    tasks: [
      {
        id: 1,
        status: TASK_STATUSES.TODO,
        completed: false
      }
    ],
    people: []
  });
});



describe("Task status validation", () => {
  test("allows all defined task statuses", () => {
    Object.values(TASK_STATUSES).forEach(status => {
      expect(isValidTaskStatus(status)).toBe(true);
    });
  });

  test("rejects invalid task statuses", () => {
    expect(isValidTaskStatus("invalid")).toBe(false);
    expect(isValidTaskStatus("")).toBe(false);
    expect(isValidTaskStatus(null)).toBe(false);
    expect(isValidTaskStatus(undefined)).toBe(false);
  });

  test("requires comment only for closed status", () => {
    expect(requiresCommentForStatus(TASK_STATUSES.CLOSED)).toBe(true);
    expect(requiresCommentForStatus(TASK_STATUSES.TODO)).toBe(false);
    expect(requiresCommentForStatus(TASK_STATUSES.IN_PROGRESS)).toBe(false);
    expect(requiresCommentForStatus(TASK_STATUSES.DONE)).toBe(false);
  });




  describe("updateTaskStatus", () => {
    test("should updates status of task", () => {
      updateTaskStatus(1, TASK_STATUSES.IN_PROGRESS);
      const state = loadState();
      expect(state.tasks[0].status)
        .toBe(TASK_STATUSES.IN_PROGRESS);
      expect(state.tasks[0].completed).toBe(false);
    });

    test("marks task as completed when DONE", () => {
      updateTaskStatus(1, TASK_STATUSES.DONE);

      const state = loadState();

      expect(state.tasks[0].completed).toBe(true);
    });

    test("throws error when state is invalid", () => {
      saveState(null);

      expect(() =>
        updateTaskStatus(1, TASK_STATUSES.DONE)
      ).toThrow("State not initialized");
    });

    test("throws error on invalid status", () => {
      expect(() =>
        updateTaskStatus(1, "FakeStatus")
      ).toThrow("Invalid task status");
    });

    test("throws error if closing without comment", () => {
      expect(() =>
        updateTaskStatus(1, TASK_STATUSES.CLOSED, "")
      ).toThrow("Comment is required for closed tasks");
    });

    test("throws error if task not found", () => {
      expect(() =>
        updateTaskStatus(999, TASK_STATUSES.IN_PROGRESS)
      ).toThrow("Task not found");
    });

    test("appends comment and marks completed when closing a task", () => {
      // Note: ensure the task has at least some initial description so we test the append behavior too
      const state = loadState();
      state.tasks[0].description = "Initial desc";
      saveState(state);

      const today = new Date().toLocaleDateString('sv-SE');
      updateTaskStatus(1, TASK_STATUSES.CLOSED, "My close reason");

      const updatedState = loadState();
      expect(updatedState.tasks[0].completed).toBe(true);
      expect(updatedState.tasks[0].comment).toBe("My close reason");
      expect(updatedState.tasks[0].description).toBe(`Initial desc\n\n[STÄNGD ${today}]: My close reason`);
    });
  })
});