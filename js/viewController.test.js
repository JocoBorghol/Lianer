import { jest } from "@jest/globals";

describe("viewController", () => {
  let controller;
  let container;
  let services;
  let taskService;

  let renderDashboard;
  let renderCalendar;
  let renderSettings;
  let renderContacts;
  let taskScreen;

  beforeEach(async () => {
    container = document.createElement("div");

    taskService = { fake: true };

    services = {
      taskService,
      dashboardViewModel: { fake: "dashboardViewModel" },
      calendarViewModel: { fake: "calendarViewModel" },
      taskScreenViewModel: { fake: "taskScreenViewModel" },
      contactViewModel: { fake: "contactViewModel" }
    };

    jest.resetModules();
    jest.clearAllMocks();

    const mockDashboard = { renderDashboard: jest.fn() };
    const mockCalendar = { renderCalendar: jest.fn() };
    const mockTasks = {
      taskScreen: jest.fn().mockReturnValue(document.createElement("div"))
    };
    const mockSettings = { renderSettings: jest.fn() };
    const mockContacts = { renderContacts: jest.fn() };

    jest.unstable_mockModule(
      "../js/views/dashboard/dashboardView.js",
      () => mockDashboard
    );

    jest.unstable_mockModule("../js/views/calendarView.js", () => mockCalendar);
    jest.unstable_mockModule("../js/taskList/taskScreen.js", () => mockTasks);
    jest.unstable_mockModule("../js/views/settingsView.js", () => mockSettings);
    jest.unstable_mockModule("../js/views/contactsView.js", () => mockContacts);

    const module = await import("../js/views/viewController.js");
    const ViewController = module.ViewController;

    renderDashboard = mockDashboard.renderDashboard;
    renderCalendar = mockCalendar.renderCalendar;
    renderSettings = mockSettings.renderSettings;
    renderContacts = mockContacts.renderContacts;
    taskScreen = mockTasks.taskScreen;

    controller = new ViewController(container, services);
  });

  test("Renders dashboard", () => {
    controller.render();

    expect(renderDashboard).toHaveBeenCalledWith(container, {
      dashboardViewModel: services.dashboardViewModel
    });
  });

  test("Renders calendar", () => {
    controller.navigate("calendar");

    expect(renderCalendar).toHaveBeenCalledWith(container, {
      calendarViewModel: services.calendarViewModel
    });
  });

  test("Renders tasks", () => {
    controller.navigate("tasks");

    expect(taskScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        taskViewModel: services.taskScreenViewModel,
        taskService,
        navigate: expect.any(Function),
        currentDate: expect.any(Date),
        onNavigateDate: expect.any(Function)
      })
    );

    expect(container.children.length).toBe(1);
  });

  test("taskScreen navigate calls setView", () => {
    controller.navigate("tasks");

    const args = taskScreen.mock.calls[0][0];

    args.navigate("contacts", { highlightId: "42" });

    expect(renderContacts).toHaveBeenCalledWith(
      container,
      { highlightId: "42" },
      {
        contactViewModel: services.contactViewModel
      }
    );
  });

  test("Renders settings", () => {
    controller.navigate("settings");

    expect(renderSettings).toHaveBeenCalledWith(
      container,
      expect.any(Function),
      taskService
    );
  });

  test("does nothing if container missing", async () => {
    const { ViewController } = await import("../js/views/viewController.js");
    const vc = new ViewController(null, services);

    expect(() => vc.render()).not.toThrow();
  });

  test("Renders contacts with params", () => {
    controller.navigate("contacts", { highlightId: "123" });

    expect(renderContacts).toHaveBeenCalledWith(
      container,
      { highlightId: "123" },
      {
        contactViewModel: services.contactViewModel
      }
    );

    controller.render();

    expect(renderContacts).toHaveBeenLastCalledWith(
      container,
      null,
      {
        contactViewModel: services.contactViewModel
      }
    );
  });

  test("container is cleared before render", () => {
    container.innerHTML = "<div>old</div>";

    controller.navigate("calendar");

    expect(container.innerHTML).toBe("");
  });

  test("navigate is called", () => {
    const spy = jest.spyOn(controller, "navigate");

    controller.navigate("calendar");

    expect(spy).toHaveBeenCalledWith("calendar");
  });

  test("rerender calls render", () => {
    const spy = jest.spyOn(controller, "render");

    controller.rerender();

    expect(spy).toHaveBeenCalled();
  });
});