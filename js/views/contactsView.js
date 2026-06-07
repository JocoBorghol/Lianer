/* global qrcode, Html5Qrcode */
import { exportContactsToVCard, parseVCard, createVCard } from "../utils/vcard.js";
import {
  initContactsDB,
  getAllContacts,
  addContact,
  updateContact,
  deleteContact,
  searchContacts,
  importContacts,
  groupAlphabetically
} from "../utils/contactsDb.js";
import { loadState } from "../storage.js";

// ===================================================================
// LAZY VENDOR SCRIPT LOADER
// ===================================================================
let vendorScriptsLoaded = false;
function loadVendorScripts() {
  if (vendorScriptsLoaded) return Promise.resolve();
  const scripts = [
    { src: "vendor/qrcode.js" },
    { src: "vendor/html5-qrcode.min.js" }
  ];
  return Promise.all(scripts.map(s => {
    if (document.querySelector(`script[src="${s.src}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = s.src;
      el.async = true;
      el.onload = resolve;
      el.onerror = () => { console.warn(`Failed to load ${s.src}`); resolve(); };
      document.head.appendChild(el);
    });
  })).then(() => { vendorScriptsLoaded = true; });
}

// ===================================================================
// STATE
// ===================================================================
let selectedContactId = null;
let isMobileDetailOpen = false;
let currentSearchTerm = "";
let currentStatusFilter = "Alla"; // State for status filter
let currentAssigneeFilter = "Alla"; // State for assignee filter
let allContacts = [];
let dbReady = false;
let showingFavorites = false; // Default: show all contacts (was true)

// ===================================================================
// MAIN RENDER
// ===================================================================
export const renderContacts = async (container, params = null) => {
  container.innerHTML = "";

  // Init DB on first render
  if (!dbReady) {
    await initContactsDB();
    dbReady = true;
  }

  // Lazy-load vendor scripts (qrcode, html5-qrcode) in parallel with DB init
  loadVendorScripts();

  allContacts = currentSearchTerm
    ? await searchContacts(currentSearchTerm)
    : await getAllContacts();

  // Auto-select if highlight param
  if (params && params.highlightId) {
    selectedContactId = params.highlightId;
  }

  // Shell
  const shell = document.createElement("div");
  shell.className = "contacts-shell";

  // Master & Detail
  const master = createMasterPanel(container, shell);
  const detail = createDetailPanel(container, shell);

  shell.append(master, detail);
  container.append(shell);

  // Mobile: show correct panel
  updateMobileView(shell);

  // Highlight scroll
  if (params && params.highlightId) {
    setTimeout(() => {
      const item = master.querySelector(`[data-id="${params.highlightId}"]`);
      if (item) {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        item.classList.add("active");
      }
    }, 100);
  }
};

// ===================================================================
// MASTER PANEL (Left: Contact List)
// ===================================================================
function createMasterPanel(container, shell) {
  const master = document.createElement("div");
  master.className = "contacts-master";

  // Header
  const header = document.createElement("div");
  header.className = "contacts-master-header";

  const title = document.createElement("h2");
  title.textContent = "Kontakter";

  const search = document.createElement("input");
  search.className = "contacts-search";
  search.placeholder = "🔍 Sök kontakt...";
  search.value = currentSearchTerm;

  let searchTimeout = null;
  search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      currentSearchTerm = search.value;
      allContacts = currentSearchTerm
        ? await searchContacts(currentSearchTerm)
        : await getAllContacts();
      refreshList(master, container, shell);
      refreshDetail(shell, container);
    }, 200);
  });

  header.append(title);
  // Search row is appended later
  master.append(header);

  // Actions
  const actions = document.createElement("div");
  actions.className = "contacts-actions";
  actions.id = "contacts-advanced-actions";

  const importVcfInput = document.createElement("input");
  importVcfInput.type = "file";
  importVcfInput.accept = ".vcf";
  importVcfInput.style.display = "none";
  importVcfInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseVCard(text);
    if (parsed && parsed.length > 0) {
      await importContacts(parsed);
      allContacts = await getAllContacts();
      refreshList(master, container, shell);
      alert(`Importerade ${parsed.length} kontakter!`);
    } else {
      alert("Kunde inte hitta kontakter i filen.");
    }
    e.target.value = "";
  };

  const importCsvInput = document.createElement("input");
  importCsvInput.type = "file";
  importCsvInput.accept = ".csv";
  importCsvInput.style.display = "none";
  importCsvInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    openCsvImportModal(text, container, shell, master);
    e.target.value = "";
  };

  const btnImportVcf = document.createElement("button");
  btnImportVcf.textContent = "📥 vCard";
  btnImportVcf.title = "Ska du till mobilen? Använd vCard.";
  btnImportVcf.onclick = () => importVcfInput.click();

  const btnImportCsv = document.createElement("button");
  btnImportCsv.textContent = "📥 CSV";
  btnImportCsv.title = "Ska du till Excel? Använd CSV.";
  btnImportCsv.onclick = () => importCsvInput.click();

  const btnExport = document.createElement("button");
  btnExport.textContent = "📤 Export";
  btnExport.title = "Exportera alla kontakter till vCard";
  btnExport.onclick = () => {
    if (allContacts.length === 0) { alert("Inga kontakter."); return; }
    exportContactsToVCard(allContacts);
  };

  const btnScan = document.createElement("button");
  btnScan.textContent = "📷 QR";
  btnScan.title = "Skanna en QR-kod för att lägga till kontakt";
  btnScan.onclick = () => openQRScanner(container, shell, master);

  const btnAdd = document.createElement("button");
  btnAdd.textContent = "+ Lägg till kontakt";
  btnAdd.className = "btn-add";
  btnAdd.title = "Skapa en ny kontakt";
  btnAdd.onclick = () => openContactModal(null, container, shell, master);

  const btnToggleFav = document.createElement("button");
  btnToggleFav.className = "btn-icon-text"; // Add class for flex alignment if needed

  // Material Design Icons
  const iconStar = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
  const iconPeople = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;

  const updateToggleBtn = () => {
    btnToggleFav.innerHTML = showingFavorites ? `${iconPeople} Alla` : `${iconStar} Favoriter`;
    btnToggleFav.title = showingFavorites ? "Visa alla kontakter" : "Visa endast favoritkontakter";
    btnToggleFav.style.borderColor = showingFavorites ? "var(--accent-yellow, #fbbf24)" : "var(--border)";
    btnToggleFav.style.color = showingFavorites ? "var(--accent-yellow, #fbbf24)" : "var(--text-dim)";
    btnToggleFav.style.display = "flex";
    btnToggleFav.style.alignItems = "center";
    btnToggleFav.style.justifyContent = "center";
    btnToggleFav.style.gap = "6px";
    btnToggleFav.style.padding = "10px 14px";
    btnToggleFav.style.borderRadius = "8px";
    btnToggleFav.style.background = "var(--bg-element)";
    btnToggleFav.style.cursor = "pointer";
  };
  updateToggleBtn();

  btnToggleFav.onclick = () => {
    showingFavorites = !showingFavorites;
    updateToggleBtn();
    refreshList(master, container, shell);
  };

  // Status Filter Dropdown
  const statusFilterSelect = document.createElement("select");
  statusFilterSelect.style.cssText = "padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-main);font-family:inherit;font-size:13px;min-width:140px;";

  const filterOpts = ["Alla", "Ej kontaktad", "Pågående", "Klar", "Förlorad", "Återkom"];
  filterOpts.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s === "Alla" ? "Status: Alla" : s;
    statusFilterSelect.append(opt);
  });

  statusFilterSelect.onchange = () => {
    currentStatusFilter = statusFilterSelect.value;
    refreshList(master, container, shell);
  };

  // Assignee Filter Dropdown
  const assigneeFilterSelect = document.createElement("select");
  assigneeFilterSelect.style.cssText = "padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-main);font-family:inherit;font-size:13px;min-width:150px;";

  const people = loadState().people || [];
  const allOpt = document.createElement("option");
  allOpt.value = "Alla";
  allOpt.textContent = "Ansvarig: Alla";
  assigneeFilterSelect.append(allOpt);

  people.forEach(p => {
    if (p === "Ingen") return;
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    assigneeFilterSelect.append(opt);
  });

  assigneeFilterSelect.onchange = () => {
    currentAssigneeFilter = assigneeFilterSelect.value;
    refreshList(master, container, shell);
  };

  actions.append(statusFilterSelect, assigneeFilterSelect, importVcfInput, importCsvInput, btnImportVcf, btnImportCsv, btnExport, btnScan, btnAdd);
  master.append(actions);

  // Prepend search bar modifications (Move search and favorites and mobile filter toggle to a row)
  const searchRow = document.createElement("div");
  searchRow.className = "contacts-search-row";
  searchRow.style.display = "flex";
  searchRow.style.gap = "8px";
  searchRow.style.alignItems = "center";
  searchRow.style.width = "100%";

  // Add the mobile filter toggle button
  const mobileFilterBtn = document.createElement("button");
  mobileFilterBtn.className = "mobile-filter-toggle";
  mobileFilterBtn.innerHTML = `⚙️`;
  mobileFilterBtn.title = "Avancerade filter / export";
  mobileFilterBtn.style.padding = "10px 14px";
  mobileFilterBtn.style.borderRadius = "8px";
  mobileFilterBtn.style.border = "1px solid var(--border)";
  mobileFilterBtn.style.background = "var(--bg-element)";
  mobileFilterBtn.style.color = "var(--text-main)";
  mobileFilterBtn.style.cursor = "pointer";

  mobileFilterBtn.onclick = () => {
    actions.classList.toggle("show-mobile-actions");
    mobileFilterBtn.classList.toggle("active");
    mobileFilterBtn.style.borderColor = mobileFilterBtn.classList.contains("active") ? "var(--accent-cyan)" : "var(--border)";
  };

  // Re-parent elements into searchRow
  search.style.flex = "1";
  searchRow.append(search, btnToggleFav, mobileFilterBtn);
  header.append(searchRow);

  // Contact List container
  const list = document.createElement("div");
  list.className = "contacts-list";
  // Make list focusable so we can tab into it logic? No, items should be focusable.
  master.append(list);

  // Handle Search Input Keyboard Navigation
  search.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const firstItem = list.querySelector(".contact-item");
      if (firstItem) {
        firstItem.focus();
      }
    }
  });

  // Global Shell Keyboard Navigation
  // We use the shell to catch events bubbling up from items
  shell.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Only handle if we are NOT in the search input (already handled safely or default behavior)
      if (e.target === search) return;

      e.preventDefault();
      const direction = e.key === "ArrowDown" ? 1 : -1;
      const items = Array.from(list.querySelectorAll(".contact-item"));
      if (items.length === 0) return;

      // Find focused item or active item
      let currentIndex = items.indexOf(document.activeElement);

      // If no item is focused, try to find the "active" selected one
      if (currentIndex === -1 && selectedContactId) {
        currentIndex = items.findIndex(item => item.dataset.id == selectedContactId);
      }

      let nextIndex;
      if (currentIndex === -1) {
        nextIndex = direction === 1 ? 0 : items.length - 1;
      } else {
        nextIndex = currentIndex + direction;
      }

      // Bounds check
      if (nextIndex >= 0 && nextIndex < items.length) {
        const nextItem = items[nextIndex];
        nextItem.focus();
        nextItem.click(); // Select it
        nextItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });

  // Count
  const count = document.createElement("div");
  count.className = "contacts-count";
  master.append(count);

  refreshList(master, container, shell);

  return master;
}

// ===================================================================
// REFRESH LIST (Alphabetical Grouped)
// ===================================================================
function refreshList(master, container, shell) {
  const list = master.querySelector(".contacts-list");
  const count = master.querySelector(".contacts-count");
  list.innerHTML = "";

  let contactsToShow = allContacts;

  // 1. Filter by Status
  if (currentStatusFilter !== "Alla") {
    contactsToShow = contactsToShow.filter(c => {
      const s = (c.status || "Ej kontaktad").toLowerCase().trim();
      return s === currentStatusFilter.toLowerCase().trim();
    });
  }

  // 1b. Filter by Assignee
  if (currentAssigneeFilter !== "Alla") {
    contactsToShow = contactsToShow.filter(c => c.assignedTo === currentAssigneeFilter);
  }

  // 2. Filter by Favorites (if active)
  if (!currentSearchTerm && showingFavorites) {
    contactsToShow = contactsToShow.filter(c => c.isFavorite);
  }

  // Material Icons
  const iconStar = `<svg viewBox="0 0 24 24" width="48" height="48" fill="var(--text-dim)"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
  const iconPeople = `<svg viewBox="0 0 24 24" width="48" height="48" fill="var(--text-dim)"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;

  if (contactsToShow.length === 0) {
    const empty = document.createElement("div");
    empty.className = "contacts-empty-state";
    const msg = showingFavorites ? "Inga favoriter markerade" : "Inga kontakter hittades";
    const icon = showingFavorites ? iconStar : iconPeople;

    empty.innerHTML = `<div class="empty-icon" style="opacity:0.5;margin-bottom:10px;">${icon}</div><div class="empty-text">${msg}</div>`;
    list.append(empty);
    count.textContent = "0 kontakter";
    return;
  }

  const groups = groupAlphabetically(contactsToShow);

  groups.forEach((contacts, letter) => {
    const letterHeader = document.createElement("div");
    letterHeader.className = "contacts-letter-header";
    letterHeader.textContent = letter;
    list.append(letterHeader);

    contacts.forEach(contact => {
      const item = createContactItem(contact, container, shell);
      list.append(item);
    });
  });

  const total = contactsToShow.length;
  count.textContent = `${total} kontakt${total !== 1 ? "er" : ""}`;
}

// ===================================================================
// CONTACT LIST ITEM
// ===================================================================
function createContactItem(contact, container, shell) {
  const item = document.createElement("div");
  item.className = "contact-item";
  item.dataset.id = contact.id;
  item.tabIndex = 0; // Make focusable for keyboard nav

  if (String(contact.id) === String(selectedContactId)) {
    item.classList.add("active");
  }

  // Avatar
  const avatar = document.createElement("div");
  avatar.className = "contact-item-avatar";
  avatar.textContent = (contact.name || "?").charAt(0);

  // Info
  const info = document.createElement("div");
  info.className = "contact-item-info";

  const name = document.createElement("div");
  name.className = "contact-item-name";

  // Status Indicator
  if (contact.status && contact.status !== "Ej kontaktad") {
    const dot = document.createElement("span");
    dot.className = "status-badge";

    let color = "#cbd5e1"; // gray
    if (contact.status === "Pågående") color = "#fcd34d"; // yellow
    if (contact.status === "Klar" || contact.status === "Vunnen") color = "#4ade80"; // green
    if (contact.status === "Förlorad") color = "#f87171"; // red
    if (contact.status === "Återkom") color = "#60a5fa"; // blue

    dot.style.backgroundColor = color;
    dot.title = contact.status;
    name.prepend(dot);
  }

  name.append(document.createTextNode(contact.name || "Namnlös"));

  const role = document.createElement("div");
  role.className = "contact-item-role";
  role.textContent = [contact.role, contact.company].filter(Boolean).join(" • ") || "";

  info.append(name, role);

  // Star Logic
  const star = document.createElement("div");
  star.className = "contact-item-star";
  star.textContent = contact.isFavorite ? "★" : "☆";
  star.style.cssText = "padding:8px;cursor:pointer;font-size:18px;color:var(--accent-yellow, #fbbf24);transition:transform 0.2s;";

  star.onclick = async (e) => {
    e.stopPropagation(); // Don't select item
    contact.isFavorite = !contact.isFavorite;
    await updateContact(contact);

    // Animate
    star.style.transform = "scale(1.4)";
    setTimeout(() => star.style.transform = "scale(1)", 200);
    star.textContent = contact.isFavorite ? "★" : "☆";

    // Refresh if we are in Favorites view and just unfavorited
    if (showingFavorites && !contact.isFavorite) {
      const master = shell.querySelector(".contacts-master");
      refreshList(master, container, shell);
    }
  };

  item.append(avatar, info, star);

  item.onclick = () => {
    if (String(selectedContactId) === String(contact.id)) {
      // Deselect if already selected
      selectedContactId = null;
      isMobileDetailOpen = false;
    } else {
      // Select new
      selectedContactId = contact.id;
      isMobileDetailOpen = true;
    }

    // Update active state in list
    const allItems = item.closest(".contacts-list").querySelectorAll(".contact-item");
    allItems.forEach(i => i.classList.remove("active"));

    if (selectedContactId) {
      item.classList.add("active");
    }

    refreshDetail(shell, container);
    updateMobileView(shell);
  };

  return item;
}

// ===================================================================
// DETAIL PANEL (Right: Contact Details)
// ===================================================================
function createDetailPanel(container, shell) {
  const detail = document.createElement("div");
  detail.className = "contacts-detail";

  refreshDetailContent(detail, container, shell);

  return detail;
}

function refreshDetail(shell, container) {
  const detail = shell.querySelector(".contacts-detail");
  if (!detail) return;
  refreshDetailContent(detail, container, shell);
}

function refreshDetailContent(detail, container, shell) {
  detail.innerHTML = "";

  const contact = allContacts.find(c => String(c.id) === String(selectedContactId));

  if (!contact) {
    const empty = document.createElement("div");
    empty.className = "contacts-empty-state";
    empty.innerHTML = `<div class="empty-icon">👤</div><div class="empty-text">Välj en kontakt för att se detaljer</div>`;
    detail.append(empty);
    return;
  }

  // Header (Always visible)
  const header = document.createElement("div");
  header.className = "detail-header";

  const backBtn = document.createElement("button");
  backBtn.className = "detail-back-btn";
  backBtn.textContent = "◀";
  backBtn.onclick = () => {
    isMobileDetailOpen = false;
    updateMobileView(shell);
  };

  const avatar = document.createElement("div");
  avatar.className = "detail-avatar";
  avatar.textContent = (contact.name || "?").charAt(0);

  const headerInfo = document.createElement("div");
  headerInfo.style.flex = "1";

  const nameRow = document.createElement("div");
  nameRow.style.display = "flex";
  nameRow.style.alignItems = "center";
  nameRow.style.gap = "12px";

  const nameEl = document.createElement("h2");
  nameEl.className = "detail-name";
  nameEl.textContent = contact.name || "Namnlös";
  nameRow.append(nameEl);

  // Status Badge in Header
  if (contact.status) {
    const badge = document.createElement("span");
    badge.style.cssText = "font-size:12px;padding:2px 8px;border-radius:12px;background:var(--bg-element);border:1px solid var(--border);color:var(--text-dim);margin-left:auto;";
    badge.textContent = contact.status;
    nameRow.append(badge);
  }

  const starBtn = document.createElement("div");
  starBtn.textContent = contact.isFavorite ? "★" : "☆";
  starBtn.style.cssText = "font-size:24px;cursor:pointer;color:var(--accent-yellow, #fbbf24);user-select:none;margin-left:10px;"; // Added margin
  starBtn.title = contact.isFavorite ? "Ta bort från favoriter" : "Lägg till i favoriter";

  starBtn.onclick = async () => {
    contact.isFavorite = !contact.isFavorite;
    await updateContact(contact);
    starBtn.textContent = contact.isFavorite ? "★" : "☆";
    starBtn.title = contact.isFavorite ? "Ta bort från favoriter" : "Lägg till i favoriter";

    // Refresh list to update star in list and/or filter
    refreshList(shell.querySelector(".contacts-master"), container, shell);
  };

  nameRow.append(starBtn); // Name + Badge + Star

  const roleEl = document.createElement("div");
  roleEl.className = "detail-role";
  roleEl.textContent = [contact.role, contact.company].filter(Boolean).join(" • ") || "Ingen titel";

  headerInfo.append(nameRow, roleEl);
  header.append(backBtn, avatar, headerInfo);
  detail.append(header);

  // TABS
  const tabs = document.createElement("div");
  tabs.className = "detail-tabs";

  const tabInfoBtn = document.createElement("button");
  tabInfoBtn.className = "detail-tab-btn active";
  tabInfoBtn.textContent = "Info";

  const tabHistoryBtn = document.createElement("button");
  tabHistoryBtn.className = "detail-tab-btn";
  tabHistoryBtn.textContent = "Historik & CRM";

  tabs.append(tabInfoBtn, tabHistoryBtn);
  detail.append(tabs);

  // TAB CONTENT: INFO
  const infoContent = document.createElement("div");
  infoContent.className = "tab-content active";
  infoContent.id = "tab-info";

  // -- Social Links --
  if (contact.social && (contact.social.linkedin || contact.social.website)) {
    const socialRow = document.createElement("div");
    socialRow.className = "social-links";

    if (contact.social.linkedin) {
      const lnk = document.createElement("a");
      lnk.className = "social-btn";
      lnk.href = contact.social.linkedin;
      lnk.target = "_blank";
      lnk.title = "LinkedIn Profil";
      lnk.innerHTML = "in"; // Simple text icon for now, or SVG if available
      socialRow.append(lnk);
    }
    if (contact.social.website) {
      const lnk = document.createElement("a");
      lnk.className = "social-btn";
      lnk.href = contact.social.website;
      lnk.target = "_blank";
      lnk.title = "Besök hemsida";
      lnk.innerHTML = "🌐";
      socialRow.append(lnk);
    }
    infoContent.append(socialRow);
  }

  // PHONE
  const phones = Array.isArray(contact.phone) ? contact.phone : [contact.phone];
  const validPhones = phones.filter(Boolean);
  if (validPhones.length > 0) {
    const section = document.createElement("div");
    section.className = "detail-section";
    const label = document.createElement("div");
    label.className = "detail-section-label";
    label.textContent = "Telefon";
    section.append(label);

    validPhones.forEach(phone => {
      const field = document.createElement("a");
      field.className = "detail-field";
      field.href = `tel:${phone}`;
      field.innerHTML = `<span class="detail-field-icon">📞</span> ${phone}`;
      section.append(field);
    });
    infoContent.append(section);
  }

  // EMAIL
  const emails = Array.isArray(contact.email) ? contact.email : [contact.email];
  const validEmails = emails.filter(Boolean);
  if (validEmails.length > 0) {
    const section = document.createElement("div");
    section.className = "detail-section";
    const label = document.createElement("div");
    label.className = "detail-section-label";
    label.textContent = "E-post";
    section.append(label);

    validEmails.forEach(email => {
      const field = document.createElement("a");
      field.className = "detail-field";
      field.href = `mailto:${email}`;
      field.innerHTML = `<span class="detail-field-icon">✉️</span> ${email}`;
      section.append(field);
    });
    infoContent.append(section);
  }

  // COMPANY
  if (contact.company) {
    const section = document.createElement("div");
    section.className = "detail-section";
    const label = document.createElement("div");
    label.className = "detail-section-label";
    label.textContent = "Företag";

    const field = document.createElement("div");
    field.className = "detail-field";
    field.innerHTML = `<span class="detail-field-icon">🏢</span> ${contact.company}`;

    section.append(label, field);
    infoContent.append(section);
  }

  // QR CODE (Moved to Info Tab)
  const qrSection = document.createElement("div");
  qrSection.className = "detail-section";
  const qrLabel = document.createElement("div");
  qrLabel.className = "detail-section-label";
  qrLabel.textContent = "QR-kod (vCard)";

  const qrContainer = document.createElement("div");
  qrContainer.className = "detail-qr";

  if (typeof qrcode !== "undefined") {
    try {
      const vCardData = createVCard(contact);
      const qr = new qrcode(0, "M");
      qr.addData(vCardData);
      qr.make();
      qrContainer.innerHTML = qr.createImgTag(4);
    } catch (e) {
      console.error(e);
      qrContainer.textContent = "Kunde inte skapa QR";
      qrContainer.style.color = "#999";
    }
  } else {
    qrContainer.textContent = "QR-bibliotek ej laddat.";
    qrContainer.style.color = "#999";
  }

  qrSection.append(qrLabel, qrContainer);
  infoContent.append(qrSection); // Append to Info Tab

  detail.append(infoContent); // Append Info Tab to Detail

  // TAB CONTENT: HISTORY (CRM)
  const historyContent = document.createElement("div");
  historyContent.className = "tab-content";
  historyContent.id = "tab-history";

  // Status Selector
  const statusSelect = document.createElement("select");
  statusSelect.className = "crm-status-select";
  const statuses = ["Ej kontaktad", "Pågående", "Klar", "Förlorad", "Återkom"];
  statuses.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (contact.status === s || (s === "Klar" && contact.status === "Vunnen")) opt.selected = true;
    statusSelect.append(opt);
  });

  statusSelect.onchange = async () => {
    const oldStatus = contact.status || "Ej kontaktad";
    const newStatus = statusSelect.value;
    contact.status = newStatus;

    // Sätt completedAt vid "Klar" för CRM veckomål
    if (newStatus === "Klar" && !contact.completedAt) {
      contact.completedAt = new Date().toISOString();
    } else if (newStatus !== "Klar") {
      contact.completedAt = null;
    }

    // Log interaction
    const logItem = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: "status_change",
      content: `Status ändrad från ${oldStatus} till ${newStatus}`,
      previousStatus: oldStatus,
      newStatus: newStatus
    };
    contact.interactionLog = [logItem, ...(contact.interactionLog || [])];
    contact.lastContactDate = new Date().toISOString();

    await updateContact(contact);
    refreshList(shell.querySelector(".contacts-master"), container, shell);
    renderTimeline(contact, historyContent);

    // CRM-synk: trigga dashboard-uppdatering i realtid
    window.dispatchEvent(new CustomEvent('renderApp'));
  };
  historyContent.append(statusSelect);

  // Assignee Selector (New)
  const assignLabel = document.createElement("div");
  assignLabel.textContent = "Ansvarig";
  assignLabel.style.cssText = "font-size:11px;font-weight:bold;color:var(--text-dim);margin-bottom:4px;text-transform:uppercase;";

  const assignSelect = document.createElement("select");
  assignSelect.className = "crm-status-select"; // Reuse style
  assignSelect.style.marginBottom = "20px";

  const people = loadState().people || [];
  const assignOptionDefault = document.createElement("option");
  assignOptionDefault.value = "";
  assignOptionDefault.textContent = "— Välj ansvarig —";
  assignSelect.append(assignOptionDefault);

  people.forEach(p => {
    if (p === "Ingen") return;
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    if (contact.assignedTo === p) opt.selected = true;
    assignSelect.append(opt);
  });

  assignSelect.onchange = async () => {
    const oldAssignee = contact.assignedTo || "Ingen";
    const newAssignee = assignSelect.value || "Ingen";
    contact.assignedTo = assignSelect.value;

    // Log interaction
    const logItem = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: "note", // Log as note/system event
      content: `Ansvarig ändrad från ${oldAssignee} till ${newAssignee}`
    };
    contact.interactionLog = [logItem, ...(contact.interactionLog || [])];

    await updateContact(contact);
    renderTimeline(contact, historyContent);
  };

  historyContent.append(assignLabel, assignSelect);

  // Add Note
  const noteInput = document.createElement("textarea");
  noteInput.className = "crm-note-input";
  noteInput.placeholder = "Skriv en notering...";

  const addNoteBtn = document.createElement("button");
  addNoteBtn.textContent = "Spara notering";
  addNoteBtn.style.cssText = "padding:8px 16px;border-radius:8px;background:var(--accent-cyan);color:var(--bg-main);border:none;cursor:pointer;font-weight:bold;margin-bottom:20px;";

  addNoteBtn.onclick = async () => {
    const text = noteInput.value.trim();
    if (!text) return;

    const logItem = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: "note",
      content: text
    };

    contact.interactionLog = [logItem, ...(contact.interactionLog || [])];
    contact.lastContactDate = new Date().toISOString();

    await updateContact(contact);
    noteInput.value = "";
    renderTimeline(contact, historyContent);
  };

  historyContent.append(noteInput, addNoteBtn);

  // Timeline Container
  const timelineContainer = document.createElement("div");
  timelineContainer.className = "crm-timeline-wrapper"; // Wrapper for updates
  historyContent.append(timelineContainer);

  renderTimeline(contact, historyContent); // Initial render

  detail.append(historyContent); // Append History Tab

  // TAB SWITCHING LOGIC
  tabInfoBtn.onclick = () => {
    tabInfoBtn.classList.add("active");
    tabHistoryBtn.classList.remove("active");
    infoContent.classList.add("active");
    historyContent.classList.remove("active");
  };
  tabHistoryBtn.onclick = () => {
    tabHistoryBtn.classList.add("active");
    tabInfoBtn.classList.remove("active");
    historyContent.classList.add("active");
    infoContent.classList.remove("active");
  };

  // Actions (Edit/Delete) - Append to Detail (outside tabs, at bottom)
  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.style.marginTop = "auto"; // Push to bottom if flex

  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️ Redigera";
  editBtn.onclick = () => {
    openContactModal(contact, container, shell, shell.querySelector(".contacts-master"));
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑️ Ta bort";
  deleteBtn.className = "btn-danger";
  deleteBtn.onclick = async () => {
    if (confirm(`Ta bort ${contact.name}?`)) {
      await deleteContact(contact.id);
      selectedContactId = null;
      allContacts = await getAllContacts();
      const master = shell.querySelector(".contacts-master");
      refreshList(master, container, shell);
      refreshDetail(shell, container); // Will show empty state

      // If mobile, go back to list
      if (window.innerWidth < 1024) {
        isMobileDetailOpen = false;
        updateMobileView(shell);
      }
    }
  };

  actions.append(editBtn, deleteBtn);
  detail.append(actions);
}

// Helper to render timeline
function renderTimeline(contact, container) {
  let wrapper = container.querySelector(".crm-timeline-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  const timeline = document.createElement("div");
  timeline.className = "crm-timeline";

  const logs = contact.interactionLog || [];
  if (logs.length === 0) {
    wrapper.innerHTML = `<div style="color:var(--text-dim);font-style:italic;">Ingen historik än.</div>`;
    return;
  }

  logs.forEach(log => {
    const item = document.createElement("div");
    item.className = "crm-timeline-item";

    const dateStr = new Date(log.date).toLocaleString("sv-SE").slice(0, 16);
    const dateEl = document.createElement("div");
    dateEl.className = "crm-timeline-date";
    dateEl.textContent = dateStr;

    const content = document.createElement("div");
    content.className = "crm-timeline-content";
    content.textContent = log.content;

    if (log.type === "status_change") {
      content.style.borderLeft = "4px solid var(--accent-yellow, #fbbf24)";
    }

    item.append(dateEl, content);
    timeline.append(item);
  });
  wrapper.append(timeline);
}

// ===================================================================
// MOBILE VIEW TOGGLE
// ===================================================================
function updateMobileView(shell) {
  if (window.innerWidth >= 768) return; // Desktop/Tablet — always show both

  const master = shell.querySelector(".contacts-master");
  const detail = shell.querySelector(".contacts-detail");

  if (isMobileDetailOpen && selectedContactId) {
    master.classList.add("hidden-mobile");
    detail.classList.remove("hidden-mobile");
  } else {
    master.classList.remove("hidden-mobile");
    detail.classList.add("hidden-mobile");
  }
}

// ===================================================================
// CONTACT MODAL (Add / Edit)
// ===================================================================
function openContactModal(contact, container, shell, master) {
  const isEdit = !!contact;

  const overlay = document.createElement("div");
  overlay.className = "csv-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const modal = document.createElement("div");
  modal.className = "csv-modal";

  const titleEl = document.createElement("h3");
  titleEl.textContent = isEdit ? "Redigera kontakt" : "Ny kontakt";

  const fields = [
    { key: "name", label: "Namn", type: "text" },
    { key: "role", label: "Roll", type: "text" },
    { key: "company", label: "Företag", type: "text" },
    { key: "phone", label: "Telefon", type: "text", hint: "Komma-separera flera" },
    { key: "email", label: "Email", type: "email", hint: "Komma-separera flera" },
    { key: "linkedin", label: "LinkedIn", type: "text", hint: "URL till profil" },
    { key: "website", label: "Hemsida", type: "text", hint: "URL till hemsida" }
  ];

  const inputs = {};

  modal.append(titleEl);

  // Status & Assignee Row
  const metaRow = document.createElement("div");
  metaRow.style.cssText = "display:flex;gap:12px;margin-bottom:12px;";

  // Status Select
  const statusContainer = document.createElement("div");
  statusContainer.style.flex = "1";
  const statusLabel = document.createElement("label");
  statusLabel.textContent = "Status";
  statusLabel.className = "meta-label"; // Ensure this class exists or allow fallback
  statusLabel.style.fontSize = "11px";

  const statusSelect = document.createElement("select");
  statusSelect.style.cssText = "width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-main);";
  const statuses = ["Ej kontaktad", "Pågående", "Klar", "Förlorad", "Återkom"];
  statuses.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (isEdit && (contact.status === s || (s === "Klar" && contact.status === "Vunnen"))) opt.selected = true;
    statusSelect.append(opt);
  });
  statusContainer.append(statusLabel, statusSelect);

  // Assignee Select
  const assignContainer = document.createElement("div");
  assignContainer.style.flex = "1";
  const assignLabel = document.createElement("label");
  assignLabel.textContent = "Ansvarig";
  assignLabel.style.fontSize = "11px";

  const assignSelect = document.createElement("select");
  assignSelect.style.cssText = "width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-main);";

  const people = loadState().people || [];
  const assignOptionDefault = document.createElement("option");
  assignOptionDefault.value = "";
  assignOptionDefault.textContent = "— Välj —";
  assignSelect.append(assignOptionDefault);

  people.forEach(p => {
    if (p === "Ingen") return;
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    if (isEdit && contact.assignedTo === p) opt.selected = true;
    assignSelect.append(opt);
  });
  assignContainer.append(assignLabel, assignSelect);

  metaRow.append(statusContainer, assignContainer);
  modal.append(metaRow);

  fields.forEach(f => {
    const row = document.createElement("div");
    row.className = "csv-mapping-row";

    const label = document.createElement("label");
    label.textContent = f.label;

    const input = document.createElement("input");
    input.type = f.type;
    input.placeholder = f.hint || f.label;
    input.style.cssText = "flex:1;padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-main);font-family:inherit;font-size:13px;";

    if (isEdit) {
      if (f.key === "linkedin" || f.key === "website") {
        input.value = contact.social ? (contact.social[f.key] || "") : "";
      } else {
        const val = contact[f.key];
        input.value = Array.isArray(val) ? val.join(", ") : (val || "");
      }
    }

    inputs[f.key] = input;
    row.append(label, input);
    modal.append(row);
  });

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;margin-top:20px;justify-content:flex-end;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Avbryt";
  cancelBtn.style.cssText = "padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-dim);cursor:pointer;font-family:inherit;";
  cancelBtn.onclick = () => overlay.remove();

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Spara";
  saveBtn.style.cssText = "padding:8px 16px;border-radius:8px;border:1px solid var(--accent-cyan);background:var(--accent-cyan);color:var(--bg-main);cursor:pointer;font-family:inherit;font-weight:bold;";

  saveBtn.onclick = async () => {
    const newStatus = statusSelect.value;
    let assignedCompletedAt = isEdit ? contact.completedAt : null;

    if (newStatus === "Klar") {
      // If newly becoming done or missing date, set date.
      if (!assignedCompletedAt) {
        assignedCompletedAt = new Date().toISOString();
      }
    } else {
      assignedCompletedAt = null;
    }

    const data = {
      id: isEdit ? contact.id : Date.now() + Math.random(),
      name: inputs.name.value.trim(),
      role: inputs.role.value.trim(),
      company: inputs.company.value.trim(),
      phone: inputs.phone.value.split(",").map(s => s.trim()).filter(Boolean),
      email: inputs.email.value.split(",").map(s => s.trim()).filter(Boolean),
      social: {
        linkedin: inputs.linkedin.value.trim(),
        website: inputs.website.value.trim()
      },
      status: newStatus,
      completedAt: assignedCompletedAt,
      assignedTo: assignSelect.value,
      interactionLog: isEdit ? (contact.interactionLog || []) : [],
      isFavorite: isEdit ? (contact.isFavorite || false) : false
    };

    if (!data.name) { alert("Namn krävs."); return; }

    // Dubblettskydd: case-insensitive namnkontroll
    const nameToCheck = data.name.toLowerCase().trim();
    const duplicate = allContacts.find(c =>
      c.name.toLowerCase().trim() === nameToCheck && String(c.id) !== String(data.id)
    );
    if (duplicate) { alert(`En kontakt med namnet "${data.name}" finns redan.`); return; }

    if (isEdit) {
      await updateContact(data);
    } else {
      await addContact(data);
    }

    selectedContactId = data.id;
    allContacts = await getAllContacts();
    refreshList(master, container, shell);
    refreshDetail(shell, container);
    overlay.remove();
  };

  btnRow.append(cancelBtn, saveBtn);
  modal.append(btnRow);
  overlay.append(modal);
  document.body.append(overlay);

  // Autofocus
  inputs.name.focus();
}

// ===================================================================
// CSV IMPORT MODAL
// ===================================================================
function openCsvImportModal(csvText, container, shell, master) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) { alert("CSV-filen verkar vara tom."); return; }

  const separator = csvText.includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(l => l.split(separator).map(c => c.trim().replace(/^"|"$/g, "")));

  const overlay = document.createElement("div");
  overlay.className = "csv-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const modal = document.createElement("div");
  modal.className = "csv-modal";

  const titleEl = document.createElement("h3");
  titleEl.textContent = "📥 CSV Import — Mappa kolumner";

  const desc = document.createElement("p");
  desc.style.cssText = "color:var(--text-dim);font-size:13px;margin-bottom:16px;";
  desc.textContent = `Hittade ${rows.length} rader och ${headers.length} kolumner. Mappa kolumnerna nedan:`;

  modal.append(titleEl, desc);

  const contactFields = [
    { key: "name", label: "Namn" },
    { key: "role", label: "Roll" },
    { key: "company", label: "Företag" },
    { key: "phone", label: "Telefon" },
    { key: "email", label: "Email" }
  ];

  const selects = {};

  contactFields.forEach(f => {
    const row = document.createElement("div");
    row.className = "csv-mapping-row";

    const label = document.createElement("label");
    label.textContent = f.label;

    const select = document.createElement("select");
    const optNone = document.createElement("option");
    optNone.value = "-1";
    optNone.textContent = "— Ignorera —";
    select.append(optNone);

    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      // Auto-select if header name matches field
      if (h.toLowerCase().includes(f.key) || h.toLowerCase().includes(f.label.toLowerCase())) {
        opt.selected = true;
      }
      select.append(opt);
    });

    selects[f.key] = select;
    row.append(label, select);
    modal.append(row);
  });

  // Preview table
  const previewTitle = document.createElement("div");
  previewTitle.style.cssText = "font-size:12px;color:var(--text-dim);margin-top:16px;margin-bottom:4px;";
  previewTitle.textContent = `Förhandsgranskning (${Math.min(5, rows.length)} rader):`;
  modal.append(previewTitle);

  const table = document.createElement("table");
  table.className = "csv-preview-table";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.append(th);
  });
  thead.append(trHead);
  table.append(thead);

  const tbody = document.createElement("tbody");
  rows.slice(0, 5).forEach(r => {
    const tr = document.createElement("tr");
    r.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  modal.append(table);

  // Buttons
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;margin-top:20px;justify-content:flex-end;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Avbryt";
  cancelBtn.style.cssText = "padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-dim);cursor:pointer;font-family:inherit;";
  cancelBtn.onclick = () => overlay.remove();

  const importBtn = document.createElement("button");
  importBtn.textContent = `Importera ${rows.length} kontakter`;
  importBtn.style.cssText = "padding:8px 16px;border-radius:8px;border:1px solid var(--accent-cyan);background:var(--accent-cyan);color:var(--bg-main);cursor:pointer;font-family:inherit;font-weight:bold;";

  importBtn.onclick = async () => {
    const mapping = {};
    contactFields.forEach(f => {
      const idx = parseInt(selects[f.key].value);
      if (idx >= 0) mapping[f.key] = idx;
    });

    if (!("name" in mapping)) { alert("Du måste mappa 'Namn'-kolumnen!"); return; }

    const contacts = rows.map(row => {
      const c = { id: Date.now() + Math.random() };
      Object.entries(mapping).forEach(([key, idx]) => {
        const val = row[idx] || "";
        if (key === "phone" || key === "email") {
          c[key] = val.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        } else {
          c[key] = val;
        }
      });
      return c;
    }).filter(c => c.name);

    if (contacts.length === 0) { alert("Inga giltiga kontakter att importera."); return; }

    await importContacts(contacts);
    allContacts = await getAllContacts();
    refreshList(master, container, shell);
    overlay.remove();
    alert(`Importerade ${contacts.length} kontakter!`);
  };

  btnRow.append(cancelBtn, importBtn);
  modal.append(btnRow);
  overlay.append(modal);
  document.body.append(overlay);
}

// ===================================================================
// QR SCANNER
// ===================================================================
function openQRScanner(container, shell, master) {
  const overlay = document.createElement("div");
  overlay.className = "csv-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const modal = document.createElement("div");
  modal.className = "csv-modal";
  modal.style.maxWidth = "400px";

  const titleEl = document.createElement("h3");
  titleEl.textContent = "📷 Skanna QR-kod";

  const readerDiv = document.createElement("div");
  readerDiv.id = "qr-reader-" + Date.now();
  readerDiv.style.cssText = "width:100%;margin-top:16px;border-radius:8px;overflow:hidden;";

  const statusMsg = document.createElement("p");
  statusMsg.style.cssText = "text-align:center;font-size:13px;color:var(--text-dim);margin-top:12px;";
  statusMsg.textContent = "Startar kamera...";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Stäng";
  closeBtn.style.cssText = "margin-top:16px;padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--bg-element);color:var(--text-dim);cursor:pointer;font-family:inherit;width:100%;";

  modal.append(titleEl, readerDiv, statusMsg, closeBtn);
  overlay.append(modal);
  document.body.append(overlay);

  let scanner = null;

  closeBtn.onclick = () => {
    if (scanner) {
      scanner.stop().catch(() => { });
    }
    overlay.remove();
  };

  // Start scanner - ensure vendor scripts are loaded first
  loadVendorScripts().then(() => {
    if (typeof Html5Qrcode === "undefined") {
      statusMsg.textContent = "❌ QR-scanner kunde inte laddas.";
      statusMsg.style.color = "red";
      return;
    }
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const cameraId = devices[devices.length - 1].id;
        scanner = new Html5Qrcode(readerDiv.id);
        scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            scanner.stop().catch(() => { });
            statusMsg.textContent = "✅ QR-kod läst!";
            statusMsg.style.color = "var(--success)";

            try {
              const parsed = parseVCard(decodedText);
              if (parsed && parsed.length > 0) {
                await importContacts(parsed);
                allContacts = await getAllContacts();
                selectedContactId = parsed[0].id;
                refreshList(master, container, shell);
                refreshDetail(shell, container);
                setTimeout(() => overlay.remove(), 800);
              } else {
                statusMsg.textContent = "❌ Ingen kontaktdata i QR-koden.";
                statusMsg.style.color = "var(--accent-crimson)";
              }
            } catch {
              statusMsg.textContent = "❌ Kunde inte läsa kontaktdata.";
              statusMsg.style.color = "var(--accent-crimson)";
            }
          },
          () => { } // Scan error (ignore, keep scanning)
        ).catch(err => {
          statusMsg.textContent = "❌ Kamerafel: " + err;
          statusMsg.style.color = "var(--accent-crimson)";
        });
      } else {
        statusMsg.textContent = "📷 Inga kameror hittades.";
        statusMsg.style.color = "var(--accent-crimson)";
      }
    }).catch(err => {
      statusMsg.textContent = "❌ Kamerafel: " + err;
      statusMsg.style.color = "var(--accent-crimson)";
    });
  }); // end loadVendorScripts().then
}
