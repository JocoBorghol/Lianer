import { describe, test, expect, beforeEach, jest, beforeAll } from "@jest/globals";
import { TaskService } from "./service/taskService.js";

// LÖSNING FÖR CI/CD: Mocka window.alert då JSDOM inte stödjer det
beforeAll(() => {
  global.alert = jest.fn();
  // Valfritt: Tysta ner console.log i testerna för renare pipeline-loggar
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe("taskService", () => {
  let service;
  let repo;

  const tasksData = [
    { id: "1", title: "Task 1", status: "TODO", assigned: "A" },
    { id: "2", title: "Task 2", status: "DONE", assigned: "B" }
  ];

  beforeEach(() => {
    repo = {
      load: jest.fn().mockReturnValue([]),
      save: jest.fn()
    };
    service = new TaskService(repo);
    jest.clearAllMocks();
  });

  test("addTask: should return null if task is null or ID exists", () => {
    service.tasks.set('1', { id: '1' });
    expect(service.addTask(null)).toBeNull();
    expect(service.addTask({ id: '1' })).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  test("addTask: should add valid task and generate ID and orderrank", () => {
    const task = { title: 'Mock task', status: 'TODO' };
    const result = service.addTask(task);
    expect(result.id).toBeDefined();
    expect(result.order).toBe('J');
    expect(repo.save).toHaveBeenCalled();
    expect(service.getTasks()).toContainEqual(result);
  });

  describe('updateTasks()', () => {
    test('should update successfully', () => {
      const org = { id: '1', title: 'old' };
      service.tasks.set('1', org);
      const updated = { id: '1', title: 'new' };
      const result = service.updateTask(updated);
      expect(result.title).toBe('new');
      expect(service.changed.has('1')).toBe(true);
      expect(repo.save).toHaveBeenCalled();
    });

    test('should return null if id missing or input bad', () => {
      expect(service.updateTask(null)).toBeNull();
      expect(service.updateTask({ title: 'no ID' })).toBeNull();
      expect(service.updateTask({ id: '999' })).toBeNull();
    });
  });

  describe('deleteTask()', () => {
    test('should delete successfully', () => {
      const org = { id: '1', title: 'old' };
      service.tasks.set('1', org);
      const result = service.deleteTask(org.id);
      expect(result).toEqual(org);
      expect(service.getTasks()).toHaveLength(0);
      expect(repo.save).toHaveBeenCalled();
    });

    test('should return null if id missing or input bad', () => {
      expect(service.deleteTask(null)).toBeNull();
      expect(service.deleteTask({ id: '999' })).toBeNull();
    });
  });

  describe("changeStatus()", () => {
    beforeEach(() => {
      service.tasks.set("1", { id: "1", status: "A", order: "J", title: "T1" });
    });

    test("returns null if id is missing", () => {
      expect(service.changeStatus(null, "B")).toBeNull();
    });
    test("returns null if status is missing", () => {
      expect(service.changeStatus("1", null)).toBeNull();
    });
    test("returns null if task not found", () => {
      expect(service.changeStatus("3432512", "B")).toBeNull();
    });
    test("returns task if same status already", () => {
      const result = service.changeStatus("1", "A");
      expect(result.status).toBe("A");
      expect(repo.save).not.toHaveBeenCalled();
    });
    test("updates status and saves", () => {
      const result = service.changeStatus("1", "B");
      expect(result.status).toBe("B");
      expect(service.changed.has("1")).toBe(true);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  test("getTasksByStatus returns sorted tasks", () => {
    service.tasks.set("1", { id: "1", status: "A", order: "J", title: "T1" });
    service.tasks.set("2", { id: "2", status: "A", order: "B", title: "T2" });
    service.tasks.set("3", { id: "3", status: "A", order: "C", title: "T3" });

    const r = service.getTasksByStatus("A");

    expect(r[0].id).toBe("2");
    expect(r[1].id).toBe("3");
    expect(r[2].id).toBe("1");
  });

  describe("_compareRank()", () => {
    test("short string ranks first", () => {
      expect(service._compareRank("A", "AA")).toBeLessThan(0);
    });
    test("compares alphabetic order correctly", () => {
      expect(service._compareRank("B", "C")).toBeLessThan(0);
    });
    test("returns 0 if rank is equal", () => {
      expect(service._compareRank("A", "A")).toBe(0);
    });
  });

  describe("order generation", () => {
    test("sets J if first task", () => {
      const task = { id: "1", status: "A" };
      service.getLatestOrderId(task);
      expect(task.order).toBe("J");
    });

    test("increments single letter correctly", () => {
      service.tasks.set("1", { id: "1", status: "A", order: "J" });
      const task = { id: "2", status: "A" };
      service.getLatestOrderId(task);
      expect(task.order).toBe("K");
    });

    test("when reaching z it should go to AA", () => {
      const result = service._genOrderId("z");
      expect(result).toBe("AA");
    });
  });

  describe("moveTask()", () => {
    beforeEach(() => {
      service.tasks.set("1", { id: "1", status: "A", order: "A", title: "T1" });
      service.tasks.set("2", { id: "2", status: "A", order: "B", title: "T2" });
      service.tasks.set("3", { id: "3", status: "A", order: "C", title: "T3" });
    });

    test("returns null if id is missing", () => {
      expect(service.moveTask(null, "up")).toBeNull();
    });
    test("returns null if task is not found", () => {
      expect(service.moveTask("1123", "up")).toBeNull();
    });
    test("does nothing if moving first up", () => {
      const result = service.moveTask("1", "up");
      expect(result.id).toBe("1");
      expect(result.order).toBe("A");
    });
    test("does nothing if moving last down", () => {
      const result = service.moveTask("3", "down");
      expect(result.id).toBe("3");
      expect(result.order).toBe("C");
    });

    test("swaps order correctly", () => {
      service.moveTask("2", "up");
      expect(service.getTaskById("2").order).toBe("A");
      expect(service.getTaskById("1").order).toBe("B");
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('Filters and sorting', () => {
    beforeEach(() => {
      service.tasks.set('1', { id: '1', status: 'A', assigned: 'Lisa', order: 'B' });
      service.tasks.set('2', { id: '2', status: 'A', assigned: 'Olle', order: 'A' });
      service.tasks.set('3', { id: '3', status: 'B', assigned: 'Lisa', order: 'C' });
    });

    test('byStatus(): should filter correctly by status', () => {
      expect(service.byStatus('A')).toHaveLength(2);
      expect(service.byStatus('C')).toHaveLength(0);
    });

    test('byAssigned(): should filter correctly', () => {
      expect(service.byAssigned('Lisa')).toHaveLength(2);
    });
  });

  test("init: should load tasks from repo", () => {
    repo.load.mockReturnValue(tasksData);
    service.init();
    expect(service.getTasks().length).toBe(2);
    expect(service.getTaskById("2").title).toBe("Task 2");
  });
});