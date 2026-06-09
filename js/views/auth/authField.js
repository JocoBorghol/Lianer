export function createAuthField({
    id,
    label,
    type,
    autocomplete,
    placeholder
}) {
    const wrapper = document.createElement("div");
    wrapper.className = "auth-field";

    const labelEl = document.createElement("label");
    labelEl.className = "auth-label";
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    const input = document.createElement("input");
    input.className = "modalInput auth-input";
    input.id = id;
    input.name = id;
    input.type = type;
    input.autocomplete = autocomplete;
    input.placeholder = placeholder;
    input.required = true;

    wrapper.append(labelEl, input);

    return wrapper;
}