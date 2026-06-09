export function createContactLeadsPanel({ contactViewModel } = {}) {
    const wrapper = document.createElement("section");
    wrapper.className = "contacts-shell contacts-leads-shell";
    wrapper.setAttribute("aria-label", "Leads från extern API");

    const panel = document.createElement("div");
    panel.className = "contacts-master contacts-leads-panel";
    panel.style.width = "100%";

    const header = document.createElement("div");
    header.className = "contacts-master-header";

    const title = document.createElement("h2");
    title.textContent = "Leads";

    const description = document.createElement("p");
    description.style.color = "var(--text-dim)";
    description.textContent = "Hämta leads via Features API → Hunter.io.";

    const formRow = document.createElement("div");
    formRow.className = "contacts-actions";
    formRow.style.display = "flex";
    formRow.style.gap = "8px";
    formRow.style.flexWrap = "wrap";
    formRow.style.padding = "0";
    formRow.style.borderBottom = "none";

    const input = document.createElement("input");
    input.className = "contacts-search";
    input.placeholder = "Exempel: stripe.com";
    input.value = "stripe.com";
    input.style.maxWidth = "260px";

    const enrichBtn = document.createElement("button");
    enrichBtn.textContent = "Hämta från Hunter";

    const loadSavedBtn = document.createElement("button");
    loadSavedBtn.textContent = "Ladda sparade leads";

    const status = document.createElement("div");
    status.className = "contacts-count";
    status.textContent = "";

    const result = document.createElement("div");
    result.className = "contacts-list";

    enrichBtn.onclick = async () => {
        const domain = input.value.trim();
        if (!domain) return;

        if (!contactViewModel?.hasLeadService?.()) {
            status.textContent = "LeadService är inte kopplad.";
            result.innerHTML = `<div class="contacts-empty-state">LeadService saknas.</div>`;
            return;
        }

        status.textContent = "Hämtar leads från extern API...";
        result.innerHTML = "";

        try {
            const data = await contactViewModel.enrichLeadDomain(domain);
            renderHunterResult(result, data);
            status.textContent = "Extern API-träff lyckades.";
        } catch (error) {
            console.error(error);
            status.textContent = "Kunde inte hämta leads.";
            result.innerHTML = `<div class="contacts-empty-state">Kunde inte hämta data från Hunter.</div>`;
        }
    };

    loadSavedBtn.onclick = async () => {
        if (!contactViewModel?.hasLeadService?.()) {
            status.textContent = "LeadService är inte kopplad.";
            result.innerHTML = `<div class="contacts-empty-state">LeadService saknas.</div>`;
            return;
        }

        status.textContent = "Laddar sparade leads...";
        result.innerHTML = "";

        try {
            const leads = await contactViewModel.loadLeads({
                page: 1,
                pageSize: 50,
                sortBy: "created",
                sortOrder: "desc"
            });

            renderSavedLeads(result, leads);
            status.textContent = `${leads.length} sparade leads hämtade.`;
        } catch (error) {
            console.error(error);
            status.textContent = "Kunde inte ladda sparade leads.";
            result.innerHTML = `<div class="contacts-empty-state">Kunde inte ladda sparade leads.</div>`;
        }
    };

    formRow.append(input, enrichBtn, loadSavedBtn);
    header.append(title, description, formRow);
    panel.append(header, status, result);
    wrapper.append(panel);

    return wrapper;
}

function renderHunterResult(container, data) {
    container.innerHTML = "";

    const raw = data?.rawLead ?? data?.data ?? data?.Data ?? data;

    const emails =
        Array.isArray(raw?.emails)
            ? raw.emails
            : Array.isArray(raw?.Emails)
                ? raw.Emails
                : [];

    if (emails.length === 0) {
        container.innerHTML = `<div class="contacts-empty-state">Inga leads hittades.</div>`;
        return;
    }

    const header = document.createElement("div");
    header.className = "contacts-letter-header";
    header.textContent =
        raw.organization
        ?? raw.Organization
        ?? raw.company
        ?? raw.Company
        ?? raw.domain
        ?? raw.Domain
        ?? data?.domain
        ?? "Hunter-resultat";

    container.append(header);

    emails.forEach(email => {
        const item = document.createElement("div");
        item.className = "contact-item";

        const firstName =
            email.firstName
            ?? email.first_name
            ?? email.FirstName
            ?? "";

        const lastName =
            email.lastName
            ?? email.last_name
            ?? email.LastName
            ?? "";

        const emailValue =
            email.value
            ?? email.email
            ?? email.Email
            ?? "";

        const avatar = document.createElement("div");
        avatar.className = "contact-item-avatar";
        avatar.textContent = (firstName || emailValue || "?")
            .charAt(0)
            .toUpperCase();

        const info = document.createElement("div");
        info.className = "contact-item-info";

        const name = document.createElement("div");
        name.className = "contact-item-name";

        const fullName = `${firstName} ${lastName}`.trim();
        name.textContent = fullName || emailValue || "Okänt namn";

        const meta = document.createElement("div");
        meta.className = "contact-item-role";
        meta.textContent = [
            email.position ?? email.Position,
            email.department ?? email.Department,
            email.confidence ? `${email.confidence}% confidence` : null,
            emailValue
        ].filter(Boolean).join(" • ");

        info.append(name, meta);
        item.append(avatar, info);
        container.append(item);
    });
}

function renderSavedLeads(container, leads) {
    container.innerHTML = "";

    if (!Array.isArray(leads) || leads.length === 0) {
        container.innerHTML = `<div class="contacts-empty-state">Inga sparade leads hittades.</div>`;
        return;
    }

    const header = document.createElement("div");
    header.className = "contacts-letter-header";
    header.textContent = "Sparade leads";
    container.append(header);

    leads.forEach(lead => {
        const raw = lead?.rawLead ?? lead;

        const firstName =
            raw.firstName
            ?? raw.FirstName
            ?? lead.firstName
            ?? "";

        const lastName =
            raw.lastName
            ?? raw.LastName
            ?? lead.lastName
            ?? "";

        const email =
            raw.email
            ?? raw.Email
            ?? (Array.isArray(lead.email) ? lead.email[0] : lead.email)
            ?? "";

        const organization =
            raw.organization
            ?? raw.Organization
            ?? raw.company
            ?? raw.Company
            ?? lead.company
            ?? "";

        const item = document.createElement("div");
        item.className = "contact-item";

        const avatar = document.createElement("div");
        avatar.className = "contact-item-avatar";
        avatar.textContent = (firstName || email || organization || "?")
            .charAt(0)
            .toUpperCase();

        const info = document.createElement("div");
        info.className = "contact-item-info";

        const name = document.createElement("div");
        name.className = "contact-item-name";

        const fullName = `${firstName} ${lastName}`.trim();
        name.textContent =
            fullName
            || email
            || organization
            || lead.name
            || "Namnlös lead";

        const meta = document.createElement("div");
        meta.className = "contact-item-role";
        meta.textContent = [
            raw.position ?? raw.Position,
            organization,
            email,
            raw.assignedToName ?? raw.AssignedToName ?? lead.assignedTo
        ].filter(Boolean).join(" • ");

        info.append(name, meta);
        item.append(avatar, info);
        container.append(item);
    });
}