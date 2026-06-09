import { jest } from "@jest/globals";

const flushAllPromises = async () => {
  for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
};

let renderDashboard;

describe("dashboardView", () => {
  let container;
  let state;
  let contacts;
  let dashboardViewModel;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();

    jest.resetModules();
    jest.clearAllMocks();

    state = {
      people: ["Ingen", "Anna", "Björn"],
      settings: {
        teamName: "Test Team",
        weeklyTarget: 5,
        weeklyCRMTarget: 5
      },
      tasks: [
        { id: 1, title: "Task 1", status: "Att göra", assigned: "Anna" },
        { id: 2, title: "Task 2", status: "Pågår", assigned: "Björn" },
        {
          id: 3,
          title: "Task 3",
          status: "Klar",
          assigned: "Anna",
          completedDate: new Date().toISOString()
        },
        { id: 4, title: "Unassigned", status: "Att göra", assigned: "Ingen" }
      ]
    };

    contacts = [
      {
        id: 1,
        name: "Customer 1",
        company: "Corp",
        status: "Klar",
        assignedTo: "Anna",
        completedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Customer 2",
        status: "Ej kontaktad",
        assignedTo: "Björn"
      },
      {
        id: 3,
        name: "Customer 3",
        status: "Pågående",
        assignedTo: "Ingen"
      }
    ];

    dashboardViewModel = {
      init: jest.fn().mockResolvedValue(),
      refresh: jest.fn().mockResolvedValue(),
      getViewState: jest.fn().mockReturnValue({ error: null }),
      getDashboardState: jest.fn(() => state),
      getContacts: jest.fn(() => contacts)
    };

    const view = await import("../js/views/dashboard/dashboardView.js");
    renderDashboard = view.renderDashboard;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("Renders Team Dashboard by default", async () => {
    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const filterSelect = container.querySelector(".taskFilterSelect");
    expect(filterSelect.value).toBe("Team");

    const headings = Array.from(container.querySelectorAll("h3")).map(
      h => h.textContent
    );

    expect(headings).toContain("Test Team – Uppgifter");
    expect(headings).toContain("Test Team – CRM");

    const taskBox = container.querySelectorAll(".dashboard-box")[0];
    expect(taskBox.textContent).toContain("Totalt: 4");
    expect(taskBox.textContent).toContain("Lediga: 1");

    const crmBox = container.querySelectorAll(".dashboard-box")[1];
    expect(crmBox.textContent).toContain("Totalt: 3");
    expect(crmBox.textContent).toContain("Lediga: 1");
  });

  test("Renders specific person Dashboard", async () => {
    localStorage.setItem("dashboardViewFilter", "Anna");

    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const headings = Array.from(container.querySelectorAll("h3")).map(
      h => h.textContent
    );

    expect(headings).toContain("Test Team – Uppgifter");
    expect(headings).toContain("Anna – Uppgifter");
  });

  test("Renders ALL Dashboards", async () => {
    localStorage.setItem("dashboardViewFilter", "ALLA");

    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const headings = Array.from(container.querySelectorAll("h3")).map(
      h => h.textContent
    );

    expect(headings).toContain("Anna – Uppgifter");
    expect(headings).toContain("Björn – Uppgifter");
  });

  test("Toggles favorites", async () => {
    localStorage.setItem("dashboardViewFilter", "ALLA");

    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const starBtns = container.querySelectorAll(".dashboard-star");
    expect(starBtns.length).toBeGreaterThan(0);

    starBtns[0].click();
    await flushAllPromises();

    const favs = JSON.parse(localStorage.getItem("dashboard:favorites"));
    expect(favs.length).toBe(1);

    localStorage.setItem("dashboardViewFilter", "Team");

    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const headings = Array.from(container.querySelectorAll("h3")).map(
      h => h.textContent
    );

    expect(headings).toContain("Anna – Uppgifter");
  });

  test("Expands status details", async () => {
    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const secondGroup = container.querySelectorAll(".status-group")[1];
    const toggle = secondGroup.querySelector(".status-toggle");

    toggle.click();
    await flushAllPromises();

    expect(secondGroup.classList.contains("open")).toBe(true);

    toggle.click();

    expect(secondGroup.classList.contains("open")).toBe(false);
  });

  test("Handles dashboard loading failure gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    dashboardViewModel.init.mockRejectedValue(new Error("Dashboard failed"));

    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    expect(container.innerHTML).toContain("Kunde inte ladda dashboard-data.");
    expect(container.innerHTML).toContain("Dashboard failed");

    consoleSpy.mockRestore();
  });

  test("Changes dashboard view filter", async () => {
    await renderDashboard(container, { dashboardViewModel });
    await flushAllPromises();

    const filterSelect = container.querySelector(".taskFilterSelect");

    filterSelect.value = "Anna";
    filterSelect.dispatchEvent(new Event("change"));

    await flushAllPromises();

    expect(localStorage.getItem("dashboardViewFilter")).toBe("Anna");
  });
});