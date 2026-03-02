import { addTaskDialog } from "../comps/dialog.js";


/**
 * (Flyttade till egen fil och satte på menyn istället för att göra den global /Alexander)
 * Händelselyssnare för interaktioner.
 * Hanterar bland annat öppning av dialogrutan för att lägga till nya uppgifter (FAB).
 * * @param {MouseEvent} e - Klickhändelsen.
 */

export const openTaskDialog = ({ taskService, taskToEdit = null }) => 
{
    const existingOverlay = document.querySelector(".modalOverlay");
    if (existingOverlay) existingOverlay.remove();
      const existingDialog = document.querySelector("dialog[open]");
    if (existingDialog) {
        existingDialog.close();
        existingDialog.remove();
    }
    const dialog = addTaskDialog(taskService, taskToEdit);
    document.body.appendChild(dialog);
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
        dialog.showModal();
    } else {
        // fallback om någon gammal version returneras
        dialog.removeAttribute("hidden");
    }

    return dialog;
};
    












