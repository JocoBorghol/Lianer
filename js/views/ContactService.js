import { contactApi } from "../api/dev/Endpoints/contactApi.js";

export class ContactService {
  constructor({ contactApi: api = contactApi, contactStore }) {
    if (!contactStore) {
      throw new Error("ContactService requires a contactStore.");
    }

    this.contactApi = api;
    this.contactStore = contactStore;
  }

  async loadContacts(paging = {}) {
    const response = await this.contactApi.getAll({
      currentPage: paging.currentPage ?? 1,
      pageSize: paging.pageSize ?? 100
    });

    const contacts = Array.isArray(response)
      ? response
      : response?.items ?? [];

    this.contactStore.setMany(contacts);

    return this.contactStore.getAll();
  }

  getContacts() {
    return this.contactStore.getAll();
  }

  getContactById(id) {
    return this.contactStore.getById(id);
  }

  async fetchContactById(id) {
    const contact = await this.contactApi.getById(id);

    if (contact?.id) {
      this.contactStore.upsert(contact);
    }

    return contact;
  }

  async createContact(requestBody) {

    const createdId = await this.contactApi.create(requestBody);

    const created = await this.contactApi.getById(createdId);

    if (created?.id) {
      this.contactStore.upsert(created);
    }

    return created;
  }

  async updateContact(id, requestBody) {

    const updatedId = await this.contactApi.update(id, requestBody);

    const updated = await this.contactApi.getById(updatedId);

    if (updated?.id) {
      this.contactStore.upsert(updated);
    }

    return updated;
  }

  async deleteContact(id) {
    await this.contactApi.delete(id);

    this.contactStore.remove(id);

    return true;
  }

  clearCache() {
    this.contactStore.clear();
  }
}