import { loadState } from "../../storage";
export class DashboardViewModel {
  #taskScreenViewModel;
  #contactViewModel;

  #isLoaded = false;
  #isLoading = false;
  #error = null;

  constructor({ taskScreenViewModel, contactViewModel }) {
    if (!taskScreenViewModel) {
      throw new Error("DashboardViewModel requires taskScreenViewModel.");
    }

    if (!contactViewModel) {
      throw new Error("DashboardViewModel requires contactViewModel.");
    }

    this.#taskScreenViewModel = taskScreenViewModel;
    this.#contactViewModel = contactViewModel;
  }

  async init() {
    if (this.#isLoaded || this.#isLoading) return;

    this.#isLoading = true;
    this.#error = null;

    try {
      await Promise.all([
        this.#taskScreenViewModel.init(),
        this.#contactViewModel.init()
      ]);

      this.#isLoaded = true;
    } catch (error) {
      console.error("DashboardViewModel failed to initialize:", error);
      this.#error = error;
    } finally {
      this.#isLoading = false;
    }
  }

  async refresh() {
    this.#isLoaded = false;
    this.#error = null;

    if (this.#contactViewModel.refresh) {
      await this.#contactViewModel.refresh();
    } else {
      await this.#contactViewModel.init();
    }

    await this.#taskScreenViewModel.init();

    this.#isLoaded = true;
  }

  getViewState() {
    return {
      isLoaded: this.#isLoaded,
      isLoading: this.#isLoading,
      error: this.#error
    };
  }

  getDashboardState() {
    const localState = loadState();
    const tasks = this.#taskScreenViewModel.getTasks();
    const people = this.#taskScreenViewModel.getPeople();

    return {
      ...localState,
      tasks,
      people,
      settings: {
        ...(localState.settings ?? {})
      }
    };
  }

  getContacts() {
    return this.#contactViewModel.getContacts();
  }
}