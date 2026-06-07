import { contactApi } from "../Endpoints/contactApi";

export class ContactService {
    constructor(api = contactApi) 
    {
        this.api = api;
        this.contacts = new Map();
    }


    async loadContacts() 
    {
        const data = await this.api.getAll();
        const safeContacts = Array.isArray(data) ? data : [];

        this.contacts.clear();

        safeContacts.forEach(contact => {
            if (!contact || !contact.id) return;
            this.contacts.set(contact.id, contact);
        });

        return this.getContacts();
    }

    getContacts() 
    {
        return Array.from(this.contacts.values());
    }

    getCachedContactById(id) 
    {
        if (!id) return null;
        return this.contacts.get(id) ?? null;
    }

    async getById(id) 
    {
        const contact = await this.api.getById(id);
        if (contact && contact.id) {
            this.contacts.set(contact.id, contact);
        }
        return contact;
    }

    async createContact(requestBody) 
    {
        const createdId = await this.api.create(requestBody);
        if (createdId) {
            const createdContact = await this.api.getById(createdId);
            if (createdContact && createdContact.id) {
                this.contacts.set(createdContact.id, createdContact);
            }
            return createdContact;
        }
        return createdId;
    }

    async updateContact(id, requestBody) 
    {
        const updatedId = await this.api.update(id, requestBody);
        const contactId = updatedId || id;
        const updatedContact = await this.api.getById(contactId);

        if (updatedContact && updatedContact.id) {
            this.contacts.set(updatedContact.id, updatedContact);
        }

        return updatedContact;
    }

    async deleteContact(id) 
    {
        await this.api.delete(id);
        this.contacts.delete(id);
        return true;
    }    
    searchCached(term) 
    {
        const q = String(term ?? "").trim().toLowerCase();

        if (!q) {
            return this.getContacts();
        }

        return this.getContacts().filter(contact => {
            const haystack = [
                contact.firstName,
                contact.lastName,
                contact.role,
                contact.company,
                ...(contact.phone ?? []),
                ...(contact.email ?? [])
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(q);
        });
    }

    byStatus(status) 
    {
        if (status === null || status === undefined || status === "Alla") {
            return this.getContacts();
        }

        return this.getContacts().filter(contact => contact.status === status);
    }

    byAssignee(userId) 
    {
        return this.getContacts().filter(contact => contact.assignedTo === userId);
    }

    favorites() 
    {
        return this.getContacts().filter(contact => contact.isFavorite === true);
    }

    clearCache() 
    {
        this.contacts.clear();
    }    
}