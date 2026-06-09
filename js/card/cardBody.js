export const cardBody = (task, {onNavigate}) =>
{
  const mainContent = document.createElement("div");
  mainContent.className = "taskMainContent";
  mainContent.innerHTML = `
    <h3 class="taskTitle highlight-title">${task.title || "Utan titel"}</h3>
    <p class="taskDescription">${task.description || "Ingen beskrivning."}</p>
  `;

  if (task.contactId && task.contactName) {
    const linkDiv = document.createElement("div");
    linkDiv.className = "task-contact-explicit";
    linkDiv.style.cssText = "margin-top: 10px; padding: 6px 10px; background: rgba(34,211,238,0.1); border-radius: 4px; color: var(--accent-cyan); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: bold; border: 1px solid rgba(34,211,238,0.2); width: fit-content;";
    linkDiv.innerHTML = `<span>🔗</span> Länkad till: ${task.contactName} <span style="opacity:0.6;font-size:10px;">↗</span>`;
    
    linkDiv.onclick = (e) => {
      e.stopPropagation(); 
      onNavigate("contacts", { highlightId: task.contactId });
    };
    
    mainContent.append(linkDiv);
  }
  return mainContent;
}
