export class ContactStore {
  #contactsById = new Map();
  #listeners = new Set();

  setMany(contacts = []) {
    this.#contactsById.clear();

    contacts.forEach(contact => {
      if (!contact?.id) return;
      this.#contactsById.set(contact.id, contact);
    });

    this.#notify();
  }

  upsert(contact) {
    if (!contact?.id) return;

    this.#contactsById.set(contact.id, contact);
    this.#notify();
  }

  remove(id) {
    if (!id) return;

    this.#contactsById.delete(id);
    this.#notify();
  }

  getAll() {
    return Array.from(this.#contactsById.values());
  }

  getById(id) {
    if (!id) return null;

    return this.#contactsById.get(id) ?? null;
  }

  clear() {
    this.#contactsById.clear();
    this.#notify();
  }

  subscribe(listener) {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  #notify() {
    this.#listeners.forEach(listener => listener());
  }
}