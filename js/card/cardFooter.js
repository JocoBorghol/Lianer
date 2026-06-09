import { renderAssigneeAvatars } from "./renderAvatars.js";
import { TASK_STATUSES } from "../status.js";

const assigneeAvatars = (task, {onEditTask}) =>
{
  let assignedArray = task.assignedTo || [];
  if (assignedArray.length === 0 && task.assigned) assignedArray = [task.assigned];
  
  const avatars = renderAssigneeAvatars(assignedArray);
  
  // FIXAD: Tar inte emot 'e' här eftersom addBtn-hjälparen hanterar det!
  const openEditDialog = () =>  onEditTask(task);

  // Om man klickar direkt på avatarerna
  avatars.onclick = (e) => {
      e.stopPropagation();
      openEditDialog();
  };

  avatars.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openEditDialog();
      }
  };
  return avatars;
}
export const cardFooter = (task, {isDone, isClosed, isTodo},{onEditTask, onMoveTask, onChangeStatus, onDeleteTask}) =>
{
  const footer = document.createElement("div");
  footer.className = "taskFooter row-layout";


  const avatars = assigneeAvatars(task, { onEditTask });
  footer.append(avatars);

  const controls = document.createElement("div");
  controls.className = "taskControls dynamic-grid";

  const addBtn = (icon, label, action, className = "") => {
    const btn = document.createElement("button");
    btn.className = `controlBtn ${className}`;
    btn.innerHTML = icon;
    btn.setAttribute("aria-label", label);
    btn.onclick = (e) => { e.stopPropagation(); action(); };
    controls.append(btn);
    };

    addBtn("↑", "Flytta upp", () => onMoveTask?.(task.id, "up"));
    addBtn("↓", "Flytta ner", () => onMoveTask?.(task.id, "down"));

  
  if (!isTodo && !isClosed) {
    const prevStatus = isDone ? TASK_STATUSES.IN_PROGRESS : TASK_STATUSES.TODO;
    addBtn("←", "Flytta vänster", () => onChangeStatus(task.id, prevStatus));
  }
  if (!isDone && !isClosed) {
    const nextStatus = isTodo ? TASK_STATUSES.IN_PROGRESS : TASK_STATUSES.DONE;
    addBtn("→", "Flytta höger", () => onChangeStatus(task.id, nextStatus));
  }

  if (!isClosed) {
    // FIXAD: Nu fungerar din redigera-knapp igen!
    addBtn('<span class="material-symbols-rounded">edit</span>', "Redigera", () => onEditTask(task), "edit-btn");
  }

  addBtn("✕", "Ta bort", () => onDeleteTask(task));

  footer.append(controls);
  return footer;
}

