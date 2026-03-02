/**
 * @file dialog.js
 * @description Modal-dialog för att skapa/redigera uppgifter.
 * Inkluderar: titel, beskrivning, deadline, teamtilldelning,
 * kontakt-autocomplete, och tidsstämplad noteringslogg.
 * WCAG 2.1 AA: role="dialog", aria-modal, :focus-visible, JSDoc.
 */
import { TASK_STATUSES } from "../status.js";
import { getPeople } from "../people/peopleService.js";




/**
 * Öppnar en modal för att skapa eller redigera en uppgift.
 * @param {Object|null} taskToEdit - Befintlig uppgift att redigera, eller null för ny.
 * @returns {HTMLElement} Overlay-elementet.
 */
export const addTaskDialog = (taskService, taskToEdit = null) => {
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay"; 
  overlay.setAttribute("role", "presentation");

  const modal = document.createElement("div");
  modal.className = "modalCard modalCard-expanded"; 
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", taskToEdit ? "Redigera uppgift" : "Skapa ny uppgift");

  const people = getPeople(); 
  const isEdit = !!taskToEdit;
  
  const titleText = isEdit ? "Redigera uppgift" : "Skapa uppgift";
  const btnText = isEdit ? "Spara ändringar" : "Skapa uppgift";
  
  let selectedContact = isEdit && taskToEdit.contactId ? { id: taskToEdit.contactId, name: taskToEdit.contactName } : null;
  
  let selectedAssignees = [];
  if (isEdit) {
    if (taskToEdit.assignedTo && Array.isArray(taskToEdit.assignedTo)) {
      selectedAssignees = taskToEdit.assignedTo;
    } else if (taskToEdit.assigned) {
      selectedAssignees = [taskToEdit.assigned];
    }
  }

  modal.innerHTML = `
    <h2>${titleText}</h2>
    <div class="modal-body ${isEdit ? "modal-split" : ""}>
      <div class="modal-col-left">
        <div class="modal-field" style="margin-bottom: 24px;">
          <label for="taskTitle" class="sr-only">Titel</label>
          <textarea id="taskTitle" placeholder="Vad ska göras? (t.ex. Kontakta Axis)" class="modalInput" style="height: 54px; min-height: 54px; resize: none; overflow: hidden; padding-top: 12px; line-height: 1.4;"></textarea>
          <div id="slashHint" class="slash-hint" aria-live="polite"></div>
        </div>
        
        <div class="modal-field" style="margin-bottom: 24px;">
          <label for="taskDesc" class="sr-only">Beskrivning</label>
          <textarea id="taskDesc" placeholder="Beskrivning av uppgiften..." class="modalInput" style="min-height: 120px; resize: none; padding-top: 12px; line-height: 1.5;"></textarea>
        </div>
        
        <div id="linkedContactBadge" style="display:none;align-items:center;gap:6px;background:rgba(34,211,238,0.1);border:1px solid var(--accent-cyan);padding:6px 10px;border-radius:6px;margin-bottom:10px;color:var(--accent-cyan);font-size:12px;">
          <span>🔗 Kontak: <strong id="linkedContactName"></strong></span>
          <span id="removeLink" style="cursor:pointer;opacity:0.7;margin-left:auto;">✕</span>
        </div>

        <div class="modal-field">
          <label class="modal-label">Vilka i teamet är ansvariga?</label>
          <div class="assignee-selector-grid" role="group" aria-label="Teammedlemmar">
            ${people.map(personName => {
    const isChecked = selectedAssignees.includes(personName) ? "checked" : "";
    const displayName = personName === "Ingen" ? "🟢 Ledig uppgift" : personName;
    return `
                <label class="assignee-chip">
                  <input type="checkbox" value="${personName}" ${isChecked}>
                  <span class="chip-text">${displayName}</span>
                </label>
              `;
            }).join("")}
          </div>
        </div>

        <div class="modal-fields-row">
          <div class="modal-field">
            <label class="modal-label" for="taskDeadline">Deadline:</label>
            <input type="date" id="taskDeadline" class="modalInput">
          </div>
          <div class="modal-field">
            <label class="modal-label" for="taskTimeStart">Från (valfri):</label>
            <input type="time" id="taskTimeStart" class="modalInput">
          </div>
          <div class="modal-field">
            <label class="modal-label" for="taskTimeEnd">Till (valfri):</label>
            <input type="time" id="taskTimeEnd" class="modalInput">
          </div>
        </div>

        <div class="modal-field" id="taskTypeRow" style="display:none;">
          <label class="modal-label">Kategori:</label>
          <div class="task-type-chips" role="group" aria-label="Uppgiftstyp">
            <label class="assignee-chip">
              <input type="radio" name="taskType" value="" checked>
              <span class="chip-text">📋 Standard</span>
            </label>
            <label class="assignee-chip">
              <input type="radio" name="taskType" value="Möte">
              <span class="chip-text">📅 Möte</span>
            </label>
          </div>
        </div>

        <div class="modal-field" id="taskPriorityRow" style="display:none;">
          <label class="modal-label">Prioritet:</label>
          <div class="task-type-chips" role="group" aria-label="Prioritet">
            <label class="assignee-chip">
              <input type="radio" name="taskPriority" value="" checked>
              <span class="chip-text">Normal</span>
            </label>
            <label class="assignee-chip">
              <input type="radio" name="taskPriority" value="Hög">
              <span class="chip-text" style="color:#ff4d4d;">🔴 Hög</span>
            </label>
          </div>
        </div>
      </div>

      ${isEdit ? `
      <div class="modal-col-right">
        <div class="modal-field modal-notes-section">
          <label class="modal-label">📝 Noteringslogg</label>
          <div class="modal-notes-input-row">
            <textarea id="taskNoteInput" placeholder="Skriv en notering..." class="modalInput task-note-input" style="min-height:50px;resize:none;"></textarea>
            <button type="button" id="addNoteBtn" class="confirmBtn task-note-btn" aria-label="Lägg till notering">+ Notera</button>
          </div>
          <div id="notesLog" class="modal-notes-log" role="log" aria-label="Noteringshistorik"></div>
        </div>
      </div>
      ` : ""}
    </div>
    <div class="modalButtons">
      <button id="cancelTask" class="cancelBtn">Avbryt</button>
      <button id="saveTask" class="confirmBtn">${btnText}</button>
    </div>
  `;

  // Populate values
  if (isEdit) {
    modal.querySelector("#taskTitle").value = taskToEdit.title || "";
    modal.querySelector("#taskDesc").value = taskToEdit.description || "";
    if (taskToEdit.deadline) {
        modal.querySelector("#taskDeadline").value = taskToEdit.deadline;
    }
    // Populate start/end time (handle both {start,end} object and legacy string)
    const tt = taskToEdit.taskTime;
    if (tt) {
      const startVal = typeof tt === "object" ? (tt.start || "") : tt;
      const endVal   = typeof tt === "object" ? (tt.end   || "") : "";
      if (startVal) modal.querySelector("#taskTimeStart").value = startVal;
      if (endVal)   modal.querySelector("#taskTimeEnd").value   = endVal;
    }
    // Show extra fields if values exist
    if (taskToEdit.taskType || taskToEdit.priority) {
      modal.querySelector("#taskTypeRow").style.display = "";
      modal.querySelector("#taskPriorityRow").style.display = "";
      if (taskToEdit.taskType) {
        const typeRadio = modal.querySelector(`input[name='taskType'][value='${taskToEdit.taskType}']`);
        if (typeRadio) typeRadio.checked = true;
      }
      if (taskToEdit.priority) {
        const prioRadio = modal.querySelector(`input[name='taskPriority'][value='${taskToEdit.priority}']`);
        if (prioRadio) prioRadio.checked = true;
      }
    }
  }
  
  // Contact badge
  const badge = modal.querySelector("#linkedContactBadge");
  const badgeName = modal.querySelector("#linkedContactName");
  const removeLink = modal.querySelector("#removeLink");
  
  const updateBadge = () => {
      if (selectedContact) {
          badge.style.display = "flex";
          badgeName.textContent = selectedContact.name;
      } else {
          badge.style.display = "none";
      }
  };
  
  removeLink.onclick = () => {
      selectedContact = null;
      updateBadge();
  };
  updateBadge();

  // --- Exclusive checkbox logic ---
  const checkboxes = modal.querySelectorAll('.assignee-chip input[type="checkbox"]');
  const ingenCb = Array.from(checkboxes).find(cb => cb.value === "Ingen");

  checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
          if (e.target.value === "Ingen" && e.target.checked) {
              checkboxes.forEach(other => {
                  if (other.value !== "Ingen") other.checked = false;
              });
          } else if (e.target.value !== "Ingen" && e.target.checked) {
              if (ingenCb) ingenCb.checked = false;
          }
      });
  });

  // --- Notes Log (only for edit mode) ---
  if (isEdit) {
    const notesLog = modal.querySelector("#notesLog");
    const noteInput = modal.querySelector("#taskNoteInput");
    const addNoteBtn = modal.querySelector("#addNoteBtn");

    /**
     * Renderar noteringsloggen i modalen.
     */
    const renderNotes = () => {
      notesLog.innerHTML = "";
      const notes = taskToEdit.notes || [];
      if (notes.length === 0) {
        notesLog.innerHTML = `<div class="notes-empty">Ingen historik ännu.</div>`;
        return;
      }
      // Kronologisk, nyast först
      [...notes].reverse().forEach(note => {
        const item = document.createElement("div");
        item.className = `notes-item ${note.type === "status" ? "notes-status" : ""}`;
        const dateStr = new Date(note.date).toLocaleString("sv-SE").slice(0, 16);
        item.innerHTML = `
          <div class="notes-meta">
            <span class="notes-date">${dateStr}</span>
            ${note.author ? `<span class="notes-author">${note.author}</span>` : ""}
          </div>
          <div class="notes-text">${escapeHtml(note.text)}</div>
        `;
        notesLog.append(item);
      });
    };

    addNoteBtn.onclick = () => {
      const text = noteInput.value.trim();
      if (!text) return;
      if (!taskToEdit.notes) taskToEdit.notes = [];
      taskToEdit.notes.push({
        text,
        date: new Date().toISOString(),
        type: "note",
        author: "" // Could be current user if auth exists
      });
      noteInput.value = "";
      renderNotes();
    };

    renderNotes();
  }

  // --- Slash command parser ---
  const titleTextarea  = modal.querySelector("#taskTitle");
  const slashHint      = modal.querySelector("#slashHint");
  const typeRow        = modal.querySelector("#taskTypeRow");
  const priorityRow    = modal.querySelector("#taskPriorityRow");
  const timeInput      = modal.querySelector("#taskTimeStart");

  const SLASH_COMMANDS = [
    { cmd: "/möte",     label: "📅 Möte – tidstyp satt, välj en tid",    type: "Möte",  prio: "" },
    { cmd: "/viktigt",  label: "🔴 Viktigt – prioritet Hög satt",         type: "",      prio: "Hög" },
    { cmd: "/uppgift",  label: "📋 Standard – normaluppgift",             type: "",      prio: "" },
  ];

  if (titleTextarea) {
    titleTextarea.addEventListener("input", () => {
      const val = titleTextarea.value;
      const match = SLASH_COMMANDS.find(sc => val.toLowerCase().startsWith(sc.cmd));
      if (match) {
        // Strip the slash command prefix
        titleTextarea.value = val.slice(match.cmd.length).trimStart();
        // Show type + priority rows
        typeRow.style.display  = "";
        priorityRow.style.display = "";
        // Set radios
        const typeRadio = match.type ? modal.querySelector(`input[name='taskType'][value='${match.type}']`) : modal.querySelector(`input[name='taskType'][value='']`);
        const prioRadio = match.prio ? modal.querySelector(`input[name='taskPriority'][value='${match.prio}']`) : modal.querySelector(`input[name='taskPriority'][value='']`);
        if (typeRadio) typeRadio.checked = true;
        if (prioRadio) prioRadio.checked = true;
        // Focus start time picker for meeting
        if (match.type === "Möte" && timeInput) setTimeout(() => timeInput.focus(), 30);
        // Apply red tint for high priority
        if (match.prio === "Hög") modal.classList.add("modal-priority-high");
        else modal.classList.remove("modal-priority-high");
        // Show hint
        slashHint.textContent = match.label;
        setTimeout(() => { slashHint.textContent = ""; }, 3000);
      }
    });
  }

  // --- Save ---
  modal.querySelector("#saveTask").onclick = () => {
    const title = modal.querySelector("#taskTitle").value.trim();
    const description = modal.querySelector("#taskDesc").value.trim();
    const deadline = modal.querySelector("#taskDeadline").value || 0;
    const timeStart = (modal.querySelector("#taskTimeStart")?.value || "").trim();
    const timeEnd   = (modal.querySelector("#taskTimeEnd")?.value   || "").trim();
    const taskTime  = timeStart ? { start: timeStart, end: timeEnd } : null;
    const taskType = modal.querySelector('input[name="taskType"]:checked')?.value || "";
    const priority = modal.querySelector('input[name="taskPriority"]:checked')?.value || "";

    const assignedTo = Array.from(modal.querySelectorAll('.assignee-chip input[type="checkbox"]:checked')).map(cb => cb.value);
    const primaryAssignee = assignedTo.length > 0 ? assignedTo[0] : "Ingen";

    if (!title) return alert("Titeln får inte vara tom!");

    if (isEdit) {
      const oldStatus = taskToEdit.status;

      const updatedTask = 
      {
        ...taskToEdit,
        title,
        description,
        assigned: primaryAssignee,
        assignedTo,
        deadline,
        taskTime,
        taskType,
        priority,
        notes:taskToEdit.notes || [],
        contactId: selectedContact ? selectedContact.id : null,
        contactName: selectedContact ? selectedContact.name : null
      };

      if(oldStatus !== updatedTask.status)
      {
        if(!updatedTask.notes) updatedTask.notes = []; //ifall tom
        updatedTask.notes.push(
          {            
            text: `Status ändrad: ${oldStatus} → ${updatedTask.status}`,
            date: new Date().toISOString(),
            type: "status"
          }
        )
      };
      taskService.updateTask(updatedTask);
    } else {
      const newTask = {
        id: "", // Auto sätter värden i service
        title,
        description,
        deadline,
        taskTime,
        taskType,
        priority,
        createdAt: new Date().toISOString(),
        status: TASK_STATUSES.TODO,
        assigned: primaryAssignee,
        assignedTo,
        contactId: selectedContact ? selectedContact.id : null,
        contactName: selectedContact ? selectedContact.name : null,
        completed: false,
        comment: "",
        notes: []
      };
      taskService.addTask(newTask);
    }

    overlay.remove();
    window.dispatchEvent(new CustomEvent('renderApp'));
  };

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  modal.querySelector("#cancelTask").onclick = () => overlay.remove();
  
  overlay.append(modal);

  // --- Autocomplete ---
  import("../utils/contactsDb.js").then(({ getAllContacts, initContactsDB }) => {
      initContactsDB().then(() => {
          getAllContacts().then(contacts => {
              if (contacts && contacts.length > 0) {
                  const attachAutocomplete = (inputEl) => {
                      inputEl.setAttribute("autocomplete", "off");
                      const wrapper = document.createElement("div");
                      wrapper.style.position = "relative";
                      inputEl.parentNode.insertBefore(wrapper, inputEl);
                      wrapper.append(inputEl);

                      const box = document.createElement("div");
                      box.className = "autocomplete-suggestions";
                      Object.assign(box.style, {
                          position: "absolute", top: "100%", left: "0", right: "0", zIndex: "6000",
                          display: "none", background: "var(--bg-deep, #111)", border: "1px solid var(--accent-cyan)",
                          borderRadius: "0 0 8px 8px", boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                          maxHeight: "160px", overflowY: "auto"
                      });
                      wrapper.append(box);

                      inputEl.addEventListener("input", () => {
                          const val = inputEl.value;
                          const cursorPos = inputEl.selectionStart;
                          const before = val.slice(0, cursorPos);
                          const words = before.split(/\s+/);
                          const word = words[words.length - 1];

                          if (word.length < 2) { box.style.display = "none"; return; }

                          const matches = contacts.filter(c => c.name.toLowerCase().startsWith(word.toLowerCase()));
                          if (matches.length === 0) { box.style.display = "none"; return; }

                          box.innerHTML = "";
                          const label = document.createElement("div");
                          label.textContent = "📇 Kontakter";
                          label.style.cssText = "padding:6px 12px;font-size:11px;color:var(--accent-cyan);letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.08);";
                          box.append(label);

                          matches.forEach(m => {
                              const item = document.createElement("div");
                              item.style.cssText = "padding:10px 14px;cursor:pointer;color:var(--text-main);display:flex;align-items:center;gap:8px;transition:background 0.15s;";

                              const nameSpan = document.createElement("span");
                              nameSpan.textContent = m.name;
                              nameSpan.style.fontWeight = "bold";

                              const roleSpan = document.createElement("span");
                              roleSpan.textContent = m.role || m.company || "";
                              roleSpan.style.cssText = "font-size:12px;color:var(--text-dim);margin-left:auto;";

                              item.append(nameSpan, roleSpan);
                              item.onmouseover = () => { item.style.background = "rgba(34,211,238,0.1)"; };
                              item.onmouseout = () => { item.style.background = "transparent"; };

                item.onclick = () => {
                  const after = val.slice(cursorPos);
                  const beforeWord = before.slice(0, -word.length);
                  inputEl.value = beforeWord + m.name + " " + after;
                  box.style.display = "none";
                  inputEl.focus();

                  selectedContact = m;
                  updateBadge();
                };
                box.append(item);
              });
              box.style.display = "block";
            });

                      const closeHandler = (e) => {
                          if (e.target !== inputEl && !box.contains(e.target)) box.style.display = "none";
                      };
                      overlay.addEventListener("click", closeHandler);
                  };

                  const titleInput = modal.querySelector("#taskTitle");
                  const descInput = modal.querySelector("#taskDesc");
                  
                  if (titleInput) attachAutocomplete(titleInput);
                  if (descInput) attachAutocomplete(descInput);
              }
          });
      });
  });

  // --- Focus Trap ---
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusable = () => Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => !el.disabled && el.offsetParent !== null);

  setTimeout(() => {
    const els = getFocusable();
    if (els.length) els[0].focus();
  }, 50);

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape') {
      overlay.remove();
    }
  });

  return overlay; 
};

/**
 * Escape HTML-tecken för säker rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Custom confirmation dialog instead of window.confirm
 * @param {string} message - Message to ask the user
 * @returns {Promise<boolean>} Resolves true if confirmed, false otherwise
 */
export const showConfirmDialog = (message) => {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "nativeModalDialog modalCard modalCard-expanded";
    dialog.innerHTML = `
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Bekräfta</h2>
      <div class="modal-body" style="margin-bottom: 24px;">
        <p style="color: var(--text-dim);">${escapeHtml(message)}</p>
      </div>
      <div class="modalButtons">
        <button id="cancelConfirm" class="cancelBtn">Avbryt</button>
        <button id="okConfirm" class="confirmBtn" style="background: var(--accent-crimson); color: white;">Ja, radera</button>
      </div>
    `;

    document.body.append(dialog);
    dialog.showModal();

    const closeDialog = (result) => {
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    dialog.querySelector("#cancelConfirm").onclick = () => closeDialog(false);
    dialog.querySelector("#okConfirm").onclick = () => closeDialog(true);

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closeDialog(false);
    });
  });
};

/**
 * Custom prompt dialog instead of window.prompt
 * @param {string} message - Message to ask the user
 * @returns {Promise<string|null>} Resolves with the string if submitted, null if cancelled
 */
export const showPromptDialog = (message) => {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "nativeModalDialog modalCard modalCard-expanded";
    dialog.innerHTML = `
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Vänligen ange</h2>
      <div class="modal-body" style="margin-bottom: 24px;">
        <label for="promptInput" style="display: block; margin-bottom: 8px; color: var(--text-dim);">${escapeHtml(message)}</label>
        <input type="text" id="promptInput" class="modalInput" style="width: 100%; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-main);" />
      </div>
      <div class="modalButtons">
        <button id="cancelPrompt" class="cancelBtn">Avbryt</button>
        <button id="okPrompt" class="confirmBtn">Bekräfta</button>
      </div>
    `;

    document.body.append(dialog);
    dialog.showModal();

    const input = dialog.querySelector("#promptInput");
    input.focus();

    const closeDialog = (result) => {
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    dialog.querySelector("#cancelPrompt").onclick = () => closeDialog(null);
    dialog.querySelector("#okPrompt").onclick = () => closeDialog(input.value);

    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeDialog(input.value);
      } else if (e.key === "Escape") {
        closeDialog(null);
      }
    });

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closeDialog(null);
    });
  });
};