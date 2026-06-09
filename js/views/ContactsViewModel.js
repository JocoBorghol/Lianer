const CONTACT_STATUS_TO_UI = Object.freeze({
  0: "Ej kontaktad",
  1: "Pågående",
  2: "Klar",
  3: "Förlorad",
  4: "Återkom"
});

const UI_TO_CONTACT_STATUS = Object.freeze({
  "Ej kontaktad": 0,
  Pågående: 1,
  Klar: 2,
  Förlorad: 3,
  Återkom: 4
});

export class ContactViewModel {
  #contactService;
  #userService;
  #leadService;
  #users = [];
  #isLoaded = false;
  #isLoading = false;
  #error = null;

    constructor({ contactService, userService = null, leadService = null }) {    
    
    if (!contactService) 
    {
      throw new Error("ContactViewModel requires a contactService.");
    }
    this.#leadService = leadService;
    this.#contactService = contactService;
    this.#userService = userService;
  }

  async init() {
    if (this.#isLoaded || this.#isLoading) return;

    this.#isLoading = true;
    this.#error = null;

    try {
      await this.#loadUsers();

      await this.#contactService.loadContacts({
        currentPage: 1,
        pageSize: 100
      });

      this.#isLoaded = true;
    } catch (error) {
      console.error("ContactViewModel failed to initialize:", error);
      this.#error = error;
    } finally {
      this.#isLoading = false;
    }
  }

  async refresh() {
    this.#isLoaded = false;
    this.#error = null;

    await this.#loadUsers();

    await this.#contactService.loadContacts({
      currentPage: 1,
      pageSize: 100
    });

    this.#isLoaded = true;
  }

  getState() {
    return {
      isLoaded: this.#isLoaded,
      isLoading: this.#isLoading,
      error: this.#error
    };
  }


hasLeadService() {
  return Boolean(this.#leadService);
}

async loadLeads(query = {}) {
  this.#assertLeadService();

  const leads = await this.#leadService.loadLeads(query);

  return leads.map(lead => this.#toLeadViewShape(lead));
}

getLeads() {
  if (!this.#leadService) return [];

  return this.#leadService
    .getLeads()
    .map(lead => this.#toLeadViewShape(lead));
}

searchLeads(searchTerm = "") {
  if (!this.#leadService) return [];

  return this.#leadService
    .searchLeads(searchTerm)
    .map(lead => this.#toLeadViewShape(lead));
}

getLeadPaging() {
  if (!this.#leadService?.getPaging) {
    return {
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0
    };
  }

  return this.#leadService.getPaging();
}

async enrichLeadDomain(domain) {
  this.#assertLeadService();

  const enriched = await this.#leadService.enrichDomain(domain);

  return this.#toLeadViewShape(enriched);
}

async importLeadDomain(domain) {
  this.#assertLeadService();

  const imported = await this.#leadService.importDomain(domain);

  return imported
    ? this.#toLeadViewShape(imported)
    : null;
}

async getLeadDetails(id) {
  this.#assertLeadService();

  const details = await this.#leadService.getLeadDetails(id);

  return this.#toLeadViewShape(details);
}

async assignLead(leadId, userId) {
  this.#assertLeadService();

  const assigned = await this.#leadService.assignLead(leadId, userId);

  return assigned
    ? this.#toLeadViewShape(assigned)
    : null;
}

#assertLeadService() {
  if (!this.#leadService) {
    throw new Error("ContactViewModel has no leadService.");
  }
}

#toLeadViewShape(lead = {}) {
  if (!lead) return null;

  const id =
    lead.id
    ?? lead.leadId
    ?? lead.Id
    ?? lead.LeadId
    ?? null;

  const domain =
    lead.domain
    ?? lead.Domain
    ?? "";

  const company =
    lead.company
    ?? lead.Company
    ?? lead.organization
    ?? lead.Organization
    ?? "";

  const email =
    lead.email
    ?? lead.Email
    ?? "";

  const phone =
    lead.phone
    ?? lead.Phone
    ?? "";

  const status =
    lead.status
    ?? lead.Status
    ?? "";

  const createdAt =
    lead.createdAt
    ?? lead.CreatedAt
    ?? lead.created
    ?? lead.Created
    ?? null;

  const confidence =
    lead.confidence
    ?? lead.Confidence
    ?? lead.score
    ?? lead.Score
    ?? null;

  const assignedTo =
    lead.assignedTo
    ?? lead.AssignedTo
    ?? null;

  return {
    id,
    domain,
    company,
    name:
      lead.name
      ?? lead.Name
      ?? company
      ?? domain
      ?? "Namnlös lead",

    email: Array.isArray(email) ? email : [email].filter(Boolean),
    phone: Array.isArray(phone) ? phone : [phone].filter(Boolean),

    status,
    createdAt,
    confidence,
    assignedTo,

    rawLead: lead
  };
}

  getAssignableUsers() {
    const users = this.#users
      .map(user => {
        const id = user.userId ?? user.id ?? user.Id ?? null;

        const fullName =
          user.fullName
          ?? user.FullName
          ?? `${user.firstName ?? user.FirstName ?? ""} ${user.lastName ?? user.LastName ?? ""}`.trim();

        if (!id || !fullName) return null;

        return {
          id,
          fullName
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "sv-SE"));

    return [
      { id: null, fullName: "Ingen" },
      ...users
    ];
  }

  getPeople() {
    return this.getAssignableUsers().map(user => user.fullName);
  }

  getContacts() {
    return this.#contactService
      .getContacts()
      .map(contact => this.#toContactViewShape(contact));
  }

  getContactById(id) {
    const contact = this.#contactService.getContactById(id);

    if (!contact) return null;

    return this.#toContactViewShape(contact);
  }

  searchContacts(searchTerm = "") {
    const normalizedSearchTerm = String(searchTerm).trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return this.getContacts();
    }

    return this.getContacts().filter(contact => {
      const searchableValues = [
        contact.name,
        contact.firstName,
        contact.lastName,
        contact.role,
        contact.company,
        contact.status,
        contact.assignedTo,
        ...(Array.isArray(contact.email) ? contact.email : [contact.email]),
        ...(Array.isArray(contact.phone) ? contact.phone : [contact.phone])
      ];

      return searchableValues
        .filter(Boolean)
        .some(value =>
          String(value).toLowerCase().includes(normalizedSearchTerm)
        );
    });
  }

  async createContact(contactDraft) {
    const request = this.#toCreateContactRequest(contactDraft);

    const created = await this.#contactService.createContact(request);

    if (!created) return null;

    return this.#toContactViewShape(created);
  }

  async updateContact(contactDraft) {
    if (!contactDraft?.id) {
      throw new Error("Cannot update contact without id.");
    }

    const request = this.#toUpdateContactRequest(contactDraft);

    const updated = await this.#contactService.updateContact(
      contactDraft.id,
      request
    );

    if (!updated) return null;

    return this.#toContactViewShape(updated);
  }

  async deleteContact(idOrContact) {
    const id = typeof idOrContact === "object"
      ? idOrContact.id
      : idOrContact;

    if (!id) {
      throw new Error("Cannot delete contact without id.");
    }

    return await this.#contactService.deleteContact(id);
  }

  async importContacts(contactDrafts = []) {
    if (!Array.isArray(contactDrafts)) {
      throw new Error("importContacts expects an array.");
    }

    const createdContacts = [];

    for (const draft of contactDrafts) {
      const created = await this.createContact(draft);

      if (created) {
        createdContacts.push(created);
      }
    }

    return createdContacts;
  }

  async #loadUsers() {
    if (!this.#userService?.loadUsers) {
      this.#users = [];
      return;
    }

    const users = await this.#userService.loadUsers();
    this.#users = Array.isArray(users) ? users : [];
  }

  #toContactViewShape(contact) {
    const id = contact.id ?? contact.Id ?? null;

    const firstName = contact.firstName ?? contact.FirstName ?? "";
    const lastName = contact.lastName ?? contact.LastName ?? "";

    const name =
      contact.name
      ?? contact.Name
      ?? `${firstName} ${lastName}`.trim()
      ?? "Namnlös";

    const assignedUserId =
      contact.assignedTo
      ?? contact.AssignedTo
      ?? null;

    const assignedName = this.#getAssignedName(assignedUserId);

    const rawStatus =
      contact.status
      ?? contact.Status
      ?? 0;

    const phone =
      contact.phone
      ?? contact.Phone
      ?? [];

    const email =
      contact.email
      ?? contact.Email
      ?? [];

    const social =
      contact.social
      ?? contact.Social
      ?? null;

    const interactionLog =
      contact.interactionLog
      ?? contact.InteractionLog
      ?? [];

    return {
      id,

      firstName,
      lastName,
      name,

      role:
        contact.role
        ?? contact.Role
        ?? "",

      company:
        contact.company
        ?? contact.Company
        ?? "",

      phone: Array.isArray(phone) ? phone : [phone].filter(Boolean),
      email: Array.isArray(email) ? email : [email].filter(Boolean),

      social: {
        linkedin:
          social?.linkedIn
          ?? social?.LinkedIn
          ?? social?.linkedin
          ?? "",
        website:
          social?.website
          ?? social?.Website
          ?? ""
      },

      status: this.#toUiStatus(rawStatus),

   
      assignedUserId,

    
      assignedTo: assignedName === "Ingen" ? "" : assignedName,

      isFavorite:
        Boolean(contact.isFavorite ?? contact.IsFavorite),

      completedAt:
        contact.completedAt
        ?? contact.CompletedAt
        ?? null,

      lastContactDate:
        contact.lastContactDate
        ?? contact.LastContactDate
        ?? null,

      interactionLog: this.#toInteractionLogViewShape(interactionLog),

      rawContact: contact
    };
  }

  #toCreateContactRequest(contactDraft = {}) {
    const { firstName, lastName } = this.#getNameParts(contactDraft);

    return {
      firstName,
      lastName,

      role: contactDraft.role ?? "",
      company: contactDraft.company ?? "",

      phone: this.#toStringArray(contactDraft.phone),
      email: this.#toStringArray(contactDraft.email),

      social: {
        linkedIn:
          contactDraft.social?.linkedIn
          ?? contactDraft.social?.linkedin
          ?? "",
        website:
          contactDraft.social?.website
          ?? ""
      },

      status: this.#toApiStatus(contactDraft.status),

   
      assignedTo: this.#getAssignedUserIdFromContactDraft(contactDraft),

      isFavorite: Boolean(contactDraft.isFavorite),

      completedAt: contactDraft.completedAt ?? null,
      lastContactDate: contactDraft.lastContactDate ?? null
    };
  }

  #toUpdateContactRequest(contactDraft = {}) {
    const { firstName, lastName } = this.#getNameParts(contactDraft);

    return {
      firstName,
      lastName,

      role: contactDraft.role ?? "",
      company: contactDraft.company ?? "",

      phone: this.#toStringArray(contactDraft.phone),
      email: this.#toStringArray(contactDraft.email),

      social: {
        linkedIn:
          contactDraft.social?.linkedIn
          ?? contactDraft.social?.linkedin
          ?? "",
        website:
          contactDraft.social?.website
          ?? ""
      },

      status: this.#toApiStatus(contactDraft.status),

   
      assignedTo: this.#getAssignedUserIdFromContactDraft(contactDraft),

      isFavorite: Boolean(contactDraft.isFavorite),

      completedAt: contactDraft.completedAt ?? null,
      lastContactDate: contactDraft.lastContactDate ?? null
    };
  }

  #toInteractionLogViewShape(interactionLog) {
    if (!Array.isArray(interactionLog)) return [];

    return interactionLog.map(entry => ({
      id: entry.id ?? entry.Id,
      date: entry.date ?? entry.Date,
      type: entry.type ?? entry.Type ?? "",
      content: entry.content ?? entry.Content ?? "",
      previousStatus:
        entry.previousStatus
        ?? entry.PreviousStatus
        ?? null,
      newStatus:
        entry.newStatus
        ?? entry.NewStatus
        ?? null
    }));
  }

  #getNameParts(contactDraft = {}) {
    const firstNameFromDraft =
      contactDraft.firstName
      ?? contactDraft.FirstName
      ?? "";

    const lastNameFromDraft =
      contactDraft.lastName
      ?? contactDraft.LastName
      ?? "";

    if (firstNameFromDraft || lastNameFromDraft) {
      return {
        firstName: String(firstNameFromDraft).trim(),
        lastName: String(lastNameFromDraft).trim() || "-"
      };
    }

    return this.#splitName(contactDraft.name ?? contactDraft.Name ?? "");
  }

  #splitName(name = "") {
    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const firstName = parts.shift() ?? "";
    const lastName = parts.join(" ") || "-";

    return {
      firstName,
      lastName
    };
  }

  #toUiStatus(status) {
    return CONTACT_STATUS_TO_UI[status] ?? "Ej kontaktad";
  }

  #toApiStatus(status) {
    return UI_TO_CONTACT_STATUS[status] ?? 0;
  }

  #toStringArray(value) {
    if (Array.isArray(value)) {
      return value
        .map(item => String(item).trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  #getAssignedName(userId) {
    if (!userId) return "Ingen";

    const user = this.#users.find(user =>
      (user.userId ?? user.id ?? user.Id) === userId
    );

    if (!user) return "Ingen";

    return (
      user.fullName
      ?? user.FullName
      ?? `${user.firstName ?? user.FirstName ?? ""} ${user.lastName ?? user.LastName ?? ""}`.trim()
      ?? "Ingen"
    );
  }

  #getAssignedUserIdFromContactDraft(contactDraft = {}) {
 
    if (Object.prototype.hasOwnProperty.call(contactDraft, "assignedUserId")) {
      return contactDraft.assignedUserId || null;
    }

    if (Object.prototype.hasOwnProperty.call(contactDraft, "AssignedUserId")) {
      return contactDraft.AssignedUserId || null;
    }

    const assignedName =
      contactDraft.assignedTo
      ?? contactDraft.AssignedTo
      ?? "";

    if (!assignedName || assignedName === "Ingen") {
      return null;
    }

    const user = this.#users.find(user => {
      const fullName =
        user.fullName
        ?? user.FullName
        ?? `${user.firstName ?? user.FirstName ?? ""} ${user.lastName ?? user.LastName ?? ""}`.trim();

      return fullName === assignedName;
    });

    return user?.userId ?? user?.id ?? user?.Id ?? null;
  }
}