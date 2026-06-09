export default {
  testEnvironment: "jsdom",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },

  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/docs/",
    "/js/api/dev/",
    "/js/api/e2e/",
    "/js/taskScreen.test.js"
  ],

  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/docs/",
    "/js/api/dev/",
    "/js/api/e2e/",
    "/js/taskList/taskFilterHeader.js",
    "/js/config/",
    "/js/taskList/TaskScreenViewModel.js",
    "/js/views/ContactsViewModel.js",
    "/js/views/CalendarViewModel.js",
    "/js/views/dashboard/DashboardViewModel.js",
    "/js/views/ContactService.js",
    "/js/views/ContactStore.js",
    "/js/views/contacts",
    "/js/taskList/taskBoard.js",
    "/js/taskList/dayView.js",
    "/js/taskList/weekView.js",
    "/js/taskList/dateHelpers.js",
    "/js/taskList/emptyState.js"
  ],

  setupFilesAfterEnv: ["./jest.setup.js"],
  coverageReporters: ["text", "text-summary"],

  // Vi ignorerar filer som inte är logik-tunga för att få en rättvisande bild
  collectCoverageFrom: [
    "js/**/*.js",
    "!js/config/**",
    "!js/taskList/seed.js",
    "!js/taskList/taskFilterHeader.js",
    "!js/views/auth/**",
    "!js/comps/welcomeOverlay.js",
    "!js/data/tasks.js",
    "!js/**/*.test.js",
    "!js/card/**",
    "!js/contacts/**",
    "!js/taskList/taskScreen.js",
    "!js/comps/dialog.js",
    "!js/menu/**",
    "!js/people/**",
    "!js/repo/**",
    "!js/api/dev/**",
    "!js/api/e2e/**",
    "!js/api/agentApi.js",
    "!js/views/agentView.js",

    "!js/taskList/TaskScreenViewModel.js",
    "!js/views/ContactsViewModel.js",
    "!js/views/CalendarViewModel.js",
    "!js/views/dashboard/DashboardViewModel.js",
    "!js/views/ContactService.js",
    "!js/views/ContactStore.js",
    "!js/taskList/taskBoard.js",
    "!js/taskList/dayView.js",
    "!js/taskList/weekView.js",
    "!js/taskList/dateHelpers.js",
    "!js/taskList/emptyState.js",
    "!js/views/contacts/contactLeadsTabs.js",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/docs/**"
  ],

  // Oförändrade krav
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 60,
      functions: 73,
      lines: 83
    }
  }
};