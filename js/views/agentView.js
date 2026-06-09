import { agentChat, agentConfirm } from "../api/agentApi.js";

/**
 * Renders the AI agent chat view into the given container.
 * @param {HTMLElement} container
 */
export function renderAgentView(container) {
    container.innerHTML = "";

    /** @type {Array<{role: string, content: string}>} */
    const history = [];

    // ── Root layout ───────────────────────────────────────────────────
    const root = document.createElement("div");
    root.className = "agent-view";
    root.setAttribute("aria-label", "AI-assistent");

    // Header
    const header = document.createElement("div");
    header.className = "agent-header";
    header.innerHTML = `
        <span class="material-symbols-rounded agent-header-icon">smart_toy</span>
        <div>
            <h2 class="agent-title">AI-assistent</h2>
            <p class="agent-subtitle">Hantera kontakter med naturligt språk</p>
        </div>
    `;

    // Messages area
    const messagesEl = document.createElement("div");
    messagesEl.className = "agent-messages";
    messagesEl.setAttribute("role", "log");
    messagesEl.setAttribute("aria-live", "polite");
    messagesEl.setAttribute("aria-label", "Konversation");

    // Welcome message
    appendBotMessage(messagesEl, "Hej! Jag är din CRM-assistent. Berätta vad du vill göra — till exempel:\n• \"Skapa kontakt Anna Svensson på Microsoft\"\n• \"Visa kontakt med id ...\"\n• \"Radera kontakten med id ...\"");

    // Input area
    const inputArea = document.createElement("div");
    inputArea.className = "agent-input-area";

    const textarea = document.createElement("textarea");
    textarea.className = "agent-input";
    textarea.placeholder = "Skriv ett meddelande...";
    textarea.setAttribute("aria-label", "Meddelande till AI-assistenten");
    textarea.rows = 1;

    // Auto-resize textarea
    textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    });

    const sendBtn = document.createElement("button");
    sendBtn.className = "agent-send-btn";
    sendBtn.setAttribute("aria-label", "Skicka meddelande");
    sendBtn.innerHTML = `<span class="material-symbols-rounded">send</span>`;

    inputArea.append(textarea, sendBtn);
    root.append(header, messagesEl, inputArea);
    container.append(root);

    // ── Event handlers ────────────────────────────────────────────────
    async function handleSend() {
        const msg = textarea.value.trim();
        if (!msg) return;

        textarea.value = "";
        textarea.style.height = "auto";
        sendBtn.disabled = true;

        appendUserMessage(messagesEl, msg);
        const typingEl = appendTyping(messagesEl);

        try {
            const response = await agentChat(msg, history);

            // Add to history for multi-turn context
            history.push({ role: "user", content: msg });
            history.push({ role: "assistant", content: response.reply });

            typingEl.remove();
            appendBotMessage(messagesEl, response.reply);

            if (response.proposal) {
                appendProposalCard(messagesEl, response.proposal, history);
            }
        } catch (err) {
            typingEl.remove();
            appendErrorMessage(messagesEl, "Kunde inte nå AI-assistenten. Kontrollera att du är inloggad och försök igen.");
            console.error("Agent chat error:", err);
        } finally {
            sendBtn.disabled = false;
            textarea.focus();
        }
    }

    sendBtn.addEventListener("click", handleSend);
    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

// ── Message renderers ─────────────────────────────────────────────────

function appendUserMessage(container, text) {
    const el = document.createElement("div");
    el.className = "agent-message agent-message--user";
    el.setAttribute("role", "listitem");
    el.textContent = text;
    container.append(el);
    el.scrollIntoView({ behavior: "smooth", block: "end" });
}

function appendBotMessage(container, text) {
    const el = document.createElement("div");
    el.className = "agent-message agent-message--bot";
    el.setAttribute("role", "listitem");
    // Preserve newlines
    el.innerHTML = text.replace(/\n/g, "<br>");
    container.append(el);
    el.scrollIntoView({ behavior: "smooth", block: "end" });
    return el;
}

function appendErrorMessage(container, text) {
    const el = document.createElement("div");
    el.className = "agent-message agent-message--error";
    el.setAttribute("role", "alert");
    el.textContent = text;
    container.append(el);
    el.scrollIntoView({ behavior: "smooth", block: "end" });
}

function appendTyping(container) {
    const el = document.createElement("div");
    el.className = "agent-message agent-message--bot agent-typing";
    el.setAttribute("aria-label", "AI skriver...");
    el.innerHTML = `<span></span><span></span><span></span>`;
    container.append(el);
    el.scrollIntoView({ behavior: "smooth", block: "end" });
    return el;
}

/**
 * Renders an action proposal card with Accept / Reject buttons.
 * @param {HTMLElement} container
 * @param {object} proposal
 */
function appendProposalCard(container, proposal, history) {
    const card = document.createElement("div");
    card.className = "agent-proposal-card";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "AI-förslag som väntar på bekräftelse");

    const actionLabels = {
        CreateContact:  "Skapa kontakt",
        GetContact:     "Hämta kontakt",
        UpdateContact:  "Uppdatera kontakt",
        DeleteContact:  "Radera kontakt",
        ListContacts:   "Lista kontakter"
    };

    const actionLabel = actionLabels[proposal.action] ?? proposal.action;
    const payloadLines = Object.entries(proposal.payload ?? {})
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => `<li><strong>${k}:</strong> ${Array.isArray(v) ? v.join(", ") : v}</li>`)
        .join("");

    card.innerHTML = `
        <div class="agent-proposal-header">
            <span class="material-symbols-rounded">smart_toy</span>
            <span class="agent-proposal-action">${actionLabel}</span>
        </div>
        <p class="agent-proposal-desc">${proposal.description}</p>
        ${payloadLines ? `<ul class="agent-proposal-payload">${payloadLines}</ul>` : ""}
        <div class="agent-proposal-actions">
            <button class="agent-proposal-btn agent-proposal-btn--accept" aria-label="Acceptera förslaget">
                <span class="material-symbols-rounded">check_circle</span> Acceptera
            </button>
            <button class="agent-proposal-btn agent-proposal-btn--reject" aria-label="Neka förslaget">
                <span class="material-symbols-rounded">cancel</span> Neka
            </button>
        </div>
    `;

    container.append(card);
    card.scrollIntoView({ behavior: "smooth", block: "end" });

    const acceptBtn = card.querySelector(".agent-proposal-btn--accept");
    const rejectBtn = card.querySelector(".agent-proposal-btn--reject");

    acceptBtn.addEventListener("click", () => handleConfirm(card, proposal, true, container, history));
    rejectBtn.addEventListener("click", () => handleConfirm(card, proposal, false, container, history));
}

async function handleConfirm(card, proposal, confirmed, container, history) {
    // Disable buttons to prevent double-click
    card.querySelectorAll("button").forEach(b => (b.disabled = true));

    const loadingEl = document.createElement("p");
    loadingEl.className = "agent-proposal-loading";
    loadingEl.textContent = confirmed ? "Utför åtgärd..." : "Avbryter...";
    card.append(loadingEl);

    try {
        const result = await agentConfirm(proposal, confirmed);

        card.remove();

        const replyText = result.message ?? (confirmed ? "Klart!" : "Åtgärden avbröts.");
        appendBotMessage(container, replyText);

        // If a contact was fetched, show its data
        if (result.data) {
            appendDataCard(container, result.data);
        }

        history.push({
            role: "assistant",
            content: replyText
        });
    } catch (err) {
        loadingEl.remove();
        card.querySelectorAll("button").forEach(b => (b.disabled = false));
        appendErrorMessage(container, "Kunde inte utföra åtgärden. Försök igen.");
        console.error("Agent confirm error:", err);
    }
}

/**
 * Renders a simple data card for read results (e.g. GetContact).
 * @param {HTMLElement} container
 * @param {object} data
 */
function appendDataCard(container, data) {
    const card = document.createElement("div");
    card.className = "agent-data-card";

    const rows = Object.entries(data)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => {
            const display = Array.isArray(v)
                ? (v.length ? v.join(", ") : "—")
                : typeof v === "object"
                    ? JSON.stringify(v)
                    : String(v);
            return `<tr><td class="agent-data-key">${k}</td><td class="agent-data-val">${display}</td></tr>`;
        })
        .join("");

    card.innerHTML = `<table class="agent-data-table"><tbody>${rows}</tbody></table>`;
    container.append(card);
    card.scrollIntoView({ behavior: "smooth", block: "end" });
}
