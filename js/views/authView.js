import { Btn } from "../comps/btn.js";

export function renderAuthView() {
    const root = document.createElement("main");
    root.className = "auth-shell";
    root.setAttribute("aria-labelledby", "authTitle");

    let mode = "login";

    const card = document.createElement("section");
    card.className = "auth-card";
    card.setAttribute("aria-live", "polite");

    const render = () => {
        card.innerHTML = "";

        const isLogin = mode === "login";

        const header = document.createElement("div");
        header.className = "auth-header";
        header.innerHTML = `
            <div class="auth-logo">L</div>
            <p class="auth-kicker">Lianer Workspace</p>
            <h1 id="authTitle">${isLogin ? "Logga in" : "Skapa konto"}</h1>
            <p class="auth-subtitle">
                ${isLogin
                    ? "Fortsätt till din arbetsyta och synka dina aktiviteter."
                    : "Skapa ett konto för att börja använda Lianer med backend-synk."}
            </p>
        `;

        const form = document.createElement("form");
        form.className = "auth-form";
        form.noValidate = true;

        if (!isLogin) {
            form.append(
                createField({
                    id: "firstName",
                    label: "Förnamn",
                    type: "text",
                    autocomplete: "given-name",
                    placeholder: "Ada"
                }),
                createField({
                    id: "lastName",
                    label: "Efternamn",
                    type: "text",
                    autocomplete: "family-name",
                    placeholder: "Lovelace"
                })
            );
        }

        form.append(
            createField({
                id: "email",
                label: "E-post",
                type: "email",
                autocomplete: "email",
                placeholder: "namn@example.com"
            }),
            createField({
                id: "password",
                label: "Lösenord",
                type: "password",
                autocomplete: isLogin ? "current-password" : "new-password",
                placeholder: "••••••••"
            })
        );

        const message = document.createElement("p");
        message.className = "auth-message";
        message.setAttribute("role", "status");
        message.setAttribute("aria-live", "polite");

        const submitBtn = Btn({
            text: isLogin ? "Logga in" : "Skapa konto",
            className: "confirmBtn auth-submit",
            type: "submit",
            ariaLabel: isLogin ? "Logga in" : "Skapa konto"
        });

        const switchBtn = Btn({
            text: isLogin ? "Jag behöver skapa konto" : "Jag har redan konto",
            className: "cancelBtn auth-switch",
            type: "button",
            ariaLabel: isLogin ? "Byt till registrering" : "Byt till login",
            onClick: () => {
                mode = isLogin ? "register" : "login";
                render();
            }
        });

        form.append(message, submitBtn, switchBtn);

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            message.textContent = isLogin
                ? "Login UI fungerar. API kopplas i phase 2."
                : "Register UI fungerar. API kopplas i phase 2.";

            window.dispatchEvent(new CustomEvent("authFormSubmitted", {
                detail: {
                    mode,
                    payload
                }
            }));
        });

        const footer = document.createElement("div");
        footer.className = "auth-footer";
        footer.innerHTML = `
            <p>© Alexander & Co. Med ensamrätt.</p>
        `;

        card.append(header, form, footer);
    };

    render();
    root.append(card);

    return root;
}

function createField({ id, label, type, autocomplete, placeholder }) {
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