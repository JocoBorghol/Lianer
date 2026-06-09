import { TASK_STATUSES } from "../status.js";
import { openTaskDialog } from "../menu/openTaskDialog.js";
import { taskList } from "../taskList/taskList.js";
import { startOfWeekMonday, getWeekNumber } from "./dateHelpers.js";
import { renderWeekView } from "./weekView.js";
import { renderDayView } from "./dayView.js";
import { createTaskFilterHeader } from "./taskFilterHeader.js";
import { renderTaskBoard } from "./taskBoard.js";

export const taskScreen = ({
    taskViewModel,
    navigate,
    currentDate,
    onNavigateDate
}) => {
    const viewModel = taskViewModel;
    const taskServiceAdapter = viewModel.getTaskServiceAdapter();

    let currentFilter = localStorage.getItem("taskViewFilter") || "Team";
    let currentViewMode = localStorage.getItem("taskViewMode") || "board";

    const screenWrapper = document.createElement("main");
    screenWrapper.classList.add("taskScreenWrapper");
    screenWrapper.setAttribute("aria-label", "Projekttavla");

    const renderLoading = () => {
        screenWrapper.innerHTML = "";

        const loading = document.createElement("div");
        loading.className = "taskContentArea";
        loading.innerHTML = `
            <p class="emptyState">Laddar aktiviteter från API...</p>
        `;

        screenWrapper.append(loading);
    };

    const renderError = (error) => {
        screenWrapper.innerHTML = "";

        const errorBox = document.createElement("div");
        errorBox.className = "taskContentArea";
        errorBox.innerHTML = `
            <section class="emptyState" role="alert">
                <h2>Kunde inte ladda aktiviteter</h2>
                <p>${error?.message ?? "Okänt fel."}</p>
            </section>
        `;

        screenWrapper.append(errorBox);
    };

    const renderReady = () => {
        screenWrapper.innerHTML = "";

        const people = viewModel.getPeople();

        const contentArea = document.createElement("div");
        contentArea.classList.add("taskContentArea");

        const toolbar = createTaskFilterHeader({
            people,
            currentFilter,
            currentViewMode,
            onNavigateDate,
            onFilterChange: (selectedFilter) => {
                currentFilter = selectedFilter;
                localStorage.setItem("taskViewFilter", currentFilter);
                updateView(currentFilter);
            },
            onViewModeChange: (viewMode) => {
                currentViewMode = viewMode;
                localStorage.setItem("taskViewMode", viewMode);
                updateView(currentFilter);
            }
        });

        const updateNavigationLabel = () => {
            if (currentViewMode === "week") {
                const mon = startOfWeekMonday(currentDate);
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);

                toolbar.dateLabel.textContent =
                    `V. ${getWeekNumber(currentDate)} (${mon.getDate()}/${mon.getMonth() + 1} - ${sun.getDate()}/${sun.getMonth() + 1})`;

                toolbar.navContainer.style.display = "flex";
                return;
            }

            if (currentViewMode === "day") {
                toolbar.dateLabel.textContent = currentDate.toLocaleDateString("sv-SE", {
                    day: "numeric",
                    month: "long"
                });

                toolbar.navContainer.style.display = "flex";
                return;
            }

            toolbar.navContainer.style.display = "none";
        };

        const updateView = (selectedFilter) => {
            contentArea.innerHTML = "";

            const allTasks = viewModel.getTasks();
            const visibleTasks = viewModel.getVisibleTasks(selectedFilter);

            updateNavigationLabel();

            if (allTasks.length === 0 && selectedFilter !== "Arkiv") {
                toolbar.filterHeader.style.display = "";

                const empty = document.createElement("section");
                empty.className = "emptyState";
                empty.innerHTML = `
                    <h2>Inga aktiviteter ännu</h2>
                `;

                contentArea.append(empty);
                return;
            }

            toolbar.filterHeader.style.display = "";

            if (currentViewMode === "week" && selectedFilter !== "Arkiv") {
                contentArea.append(
                    renderWeekView(visibleTasks, currentDate, taskServiceAdapter)
                );
                return;
            }

            if (currentViewMode === "day" && selectedFilter !== "Arkiv") {
                contentArea.append(
                    renderDayView(visibleTasks, currentDate, taskServiceAdapter)
                );
                return;
            }

            contentArea.append(renderTaskBoard({
                tasks: allTasks,
                selectedFilter,
                taskService: taskServiceAdapter,
                navigate,
                taskList,
                openTaskDialog,
                TASK_STATUSES
            }));
        };

        screenWrapper.append(toolbar.filterHeader, contentArea);
        updateView(currentFilter);
    };

    renderLoading();

    viewModel
        .init()
        .then(() => {
            const state = viewModel.getState();

            if (state.error) {
                renderError(state.error);
                return;
            }

            renderReady();
        })
        .catch(renderError);

    return screenWrapper;
};