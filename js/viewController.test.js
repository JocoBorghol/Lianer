import { jest } from '@jest/globals';



describe("viewController", () => {
    let controller;
    let container;
    let service;

    let renderDashboard;
    let renderCalendar;
    let renderSettings;
    let renderContacts;
    let taskScreen;
    beforeEach(async () => {
        container = document.createElement("div");
        service = {fake: true}
        
        jest.resetModules();
        jest.clearAllMocks();

        const mockDashboard = { renderDashboard: jest.fn() };
        const mockCalendar = { renderCalendar: jest.fn() };
        const mockTasks = { taskScreen: jest.fn().mockReturnValue(document.createElement("div")) };
        const mockSettings = { renderSettings: jest.fn() };
        const mockContacts = { renderContacts: jest.fn() };

        jest.unstable_mockModule("../js/views/dashboardView.js", () => mockDashboard);
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
        controller = new ViewController(container, service);
    });

    test("Renders dashboard", () => {
        controller.render();
        expect(renderDashboard).toHaveBeenCalledWith(container);
    });

    test("Renders calendar", () => {
        controller.navigate("calendar");
        expect(renderCalendar).toHaveBeenCalledWith(container);
    });

    test("Renders tasks", () => {
        controller.navigate("tasks");

        expect(taskScreen).toHaveBeenCalledWith({
        taskService: service,
        navigate: expect.any(Function)
        });
        expect(container.children.length).toBe(1);
    });
        test("taskScreen navigate calls setView", () => {
        controller.navigate("tasks");


        const args = taskScreen.mock.calls[0][0];


        args.navigate("contacts", { highlightId: "42" });

        expect(renderContacts).toHaveBeenCalledWith(container, { highlightId: "42" });
        });
    test("Renders settings", () => {
         controller.navigate("settings");

        expect(renderSettings).toHaveBeenCalledWith(
        container,
        expect.any(Function),
        service
        );
    });
    test("does nothing if container missing", async () => {
        const { ViewController } = await import("../js/views/viewController.js");
        const vc = new ViewController(null, service);
        vc.render();
        });

    test("Renders contacts with params", () => {
        controller.navigate("contacts", { highlightId: '123' });
        expect(renderContacts).toHaveBeenCalledWith(container, { highlightId: '123' });

         controller.render();
        expect(renderContacts).toHaveBeenLastCalledWith(container, null);
    });

  test("container is cleared before render", () => {
    container.innerHTML = "<div>old</div>";
     controller.navigate("calendar");
    expect(container.innerHTML).toBe("");
  });

  test("navigate is called", () => {
    const spy = jest.spyOn( controller, "navigate");
     controller.navigate("calendar");
    expect(spy).toHaveBeenCalledWith("calendar");
  });

  test("rerender calls render", () => {
    const spy = jest.spyOn( controller, "render");
     controller.rerender();
    expect(spy).toHaveBeenCalled();
  });



});