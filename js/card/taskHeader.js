
export const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 0 || dateStr === "Nyss") return "Nyss";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('sv-SE', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const renderAssigneeAvatars = (assignedNames = []) => {
  const container = document.createElement("div");
  container.className = "assignee-avatars-list";
  container.setAttribute("role", "button");
  container.setAttribute("tabindex", "0");
  container.setAttribute("aria-label", "Hantera ansvariga");

  if (!assignedNames || assignedNames.length === 0 || (assignedNames.length === 1 && assignedNames[0] === "Ingen")) {
    const empty = document.createElement("span");
    empty.className = "avatar-empty";
    empty.innerHTML = "🟢 Ledig <span style='font-size: 10px; opacity: 0.5; margin-left: 4px;'>✎</span>";
    container.append(empty);
    return container;
  }

  const validNames = assignedNames.filter(name => name && name !== "Ingen");
  
  validNames.forEach((name) => {
    const avatar = document.createElement("div");
    avatar.className = "assignee-avatar-circle";
    avatar.title = name;
    
    // Plockar ut initialerna
    const initials = name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2).toUpperCase();
    avatar.textContent = initials;
    
    container.append(avatar);
  });

  return container;
};

export const cardHeader = (task, {isDone, isClosed}) =>
{
  const headerRow = document.createElement("div");
  headerRow.className = "card-header-row";

  const dateRow = document.createElement("div");
  dateRow.className = "date-row";
  dateRow.innerHTML = `
    <div class="meta-item"><span class="meta-label">SKAPAD</span><span class="meta-value">${formatDate(task.createdAt)}</span></div>
  `;

  if (task.deadline) {
    const isOverdue = new Date(task.deadline) < new Date() && !isDone && !isClosed;
    dateRow.innerHTML += `
      <div class="meta-item ${isOverdue ? "deadline-overdue" : ""}">
        <span class="meta-label">DEADLINE</span><span class="meta-value">${formatDate(task.deadline)}</span>
      </div>
    `;
  }

  const badge = document.createElement("div");
  badge.className = "statusBadge hero-badge";
  badge.setAttribute("data-status", task.status);
  badge.textContent = task.status;

  headerRow.append(dateRow, badge);
  return headerRow;
}
