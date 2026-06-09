// ---------- NAVIGERINGSKONTROLLER (PILAR) ----------
function createNavigationControls({ getCurrentViewMode, onNavigateDate }) {
  const navContainer = document.createElement("div");
  navContainer.className = "task-view-nav-strip";

  const prevBtn = document.createElement("button");
  prevBtn.className = "task-nav-btn";
  prevBtn.innerHTML = "◀";
  prevBtn.onclick = () => {
    const steps = (getCurrentViewMode() === "week") ? -7 : -1;
    onNavigateDate(steps);
  };

  const nextBtn = document.createElement("button");
  nextBtn.className = "task-nav-btn";
  nextBtn.innerHTML = "▶";
  nextBtn.onclick = () => {
    const steps = (getCurrentViewMode() === "week") ? 7 : 1;
    onNavigateDate(steps);
  };

  const dateLabel = document.createElement("span");
  dateLabel.className = "task-nav-date-label";

  navContainer.append(prevBtn, dateLabel, nextBtn);

  return { navContainer, dateLabel };
}

// ---------- VIEW MODE TOGGLE ----------
function createViewToggleBar({ currentViewMode, onViewModeChange, setCurrentViewMode }) {
  const viewToggleBar = document.createElement("div");
  viewToggleBar.className = "view-toggle-bar";
  viewToggleBar.setAttribute("role", "group");
  viewToggleBar.setAttribute("aria-label", "Visa som");

  const viewModes = [
    { key: "board", label: "📦 Board" },
    { key: "week",  label: "📅 Vecka" },
    { key: "day",   label: "⏰ Dag" },
  ];

  viewModes.forEach(vm => {
    const btn = document.createElement("button");
    btn.className = `view-toggle-btn${currentViewMode === vm.key ? " active" : ""}`;
    btn.textContent = vm.label;
    btn.setAttribute("aria-pressed", String(currentViewMode === vm.key));
    btn.onclick = () => {
      setCurrentViewMode(vm.key);
      viewToggleBar.querySelectorAll(".view-toggle-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
      onViewModeChange(vm.key);
    };
    viewToggleBar.append(btn);
  });

  return viewToggleBar;
}

// ---------- FILTERKONTROLLER ----------
function createFilterSelect({ people, currentFilter }) {
  const select = document.createElement("select");
  select.id = "task-filter-select";
  select.classList.add("taskFilterSelect");
  select.setAttribute("aria-controls", "task-board");

  const teamOption = document.createElement("option");
  teamOption.value = "Team";
  teamOption.textContent = "Hela Teamet";
  if (currentFilter === "Team") teamOption.selected = true;
  select.append(teamOption);

  const teamSeparator = document.createElement("option");
  teamSeparator.disabled = true;
  teamSeparator.textContent = "────────────────";
  select.append(teamSeparator);

  people.forEach(personName => {
    const option = document.createElement("option");
    option.value = personName;
    option.textContent = (personName === "Ingen") ? "🟢 Lediga uppgifter" : personName;
    if (personName === currentFilter) option.selected = true;
    select.append(option);
  });

  const archiveSeparator = document.createElement("option");
  archiveSeparator.disabled = true;
  archiveSeparator.textContent = "────────────────";
  select.append(archiveSeparator);

  const archiveOption = document.createElement("option");
  archiveOption.value = "Arkiv";
  archiveOption.textContent = "📁 Visa Stängda Uppgifter";
  if (currentFilter === "Arkiv") archiveOption.selected = true;
  select.append(archiveOption);

  return select;
}

export function createTaskFilterHeader({
  people,
  currentFilter,
  currentViewMode,
  onNavigateDate,
  onFilterChange,
  onViewModeChange
}) {
  let activeViewMode = currentViewMode;

  const filterHeader = document.createElement("header");
  filterHeader.classList.add("taskFilterContainer");

  const filterLabel = document.createElement("label");
  filterLabel.setAttribute("for", "task-filter-select");
  filterLabel.classList.add("filterLabel");
  filterLabel.textContent = "Visa uppgifter för: ";

  const select = createFilterSelect({ people, currentFilter });

  const { navContainer, dateLabel } = createNavigationControls({
    getCurrentViewMode: () => activeViewMode,
    onNavigateDate
  });

  const viewToggleBar = createViewToggleBar({
    currentViewMode,
    setCurrentViewMode: (viewMode) => {
      activeViewMode = viewMode;
    },
    onViewModeChange
  });

  select.addEventListener("change", (e) => {
    onFilterChange(e.target.value);
  });

  // Nav-strippen läggs till mellan select och viewToggle
  filterHeader.append(filterLabel, select, navContainer, viewToggleBar);

  return {
    filterHeader,
    select,
    navContainer,
    dateLabel,
    viewToggleBar
  };
}
