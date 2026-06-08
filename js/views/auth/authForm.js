import { Btn } from "../../comps/btn.js";
import { createAuthField } from "./authField.js";

export function createAuthForm({
    isLogin,
    onSwitchMode,
    onSubmit,
    onGoogleLogin
}) {
    const form = document.createElement("form");
    form.className = "auth-form";
    form.noValidate = true;

    if (!isLogin) {
        form.append(
            createAuthField({
                id: "firstName",
                label: "Förnamn",
                type: "text",
                autocomplete: "given-name",
                placeholder: "Förnamn"
            }),
            createAuthField({
                id: "lastName",
                label: "Efternamn",
                type: "text",
                autocomplete: "family-name",
                placeholder: "Efternamn"
            })
        );
    }

    form.append(
        createAuthField({
            id: "email",
            label: "E-post",
            type: "email",
            autocomplete: "email",
            placeholder: "namn@example.com"
        }),
        createAuthField({
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

    const googleBtn = Btn({
        text: "Fortsätt med Google",
        className: "cancelBtn auth-google",
        type: "button",
        ariaLabel: "Logga in med Google",
        onClick: async () => {
            if (!onGoogleLogin) return;

            await onGoogleLogin({
                setMessage(text) {
                    message.textContent = text;
                },

                setDisabled(isDisabled) {
                    submitBtn.disabled = isDisabled;
                    switchBtn.disabled = isDisabled;
                    googleBtn.disabled = isDisabled;
                }
            });
        }
    });

    const switchBtn = Btn({
        text: isLogin ? "Jag behöver skapa konto" : "Jag har redan konto",
        className: "cancelBtn auth-switch",
        type: "button",
        ariaLabel: isLogin ? "Byt till registrering" : "Byt till login",
        onClick: onSwitchMode
    });

    form.append(message, submitBtn, googleBtn, switchBtn);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        await onSubmit(payload, {
            setMessage(text) {
                message.textContent = text;
            },

            setDisabled(isDisabled) {
                submitBtn.disabled = isDisabled;
                switchBtn.disabled = isDisabled;
                googleBtn.disabled = isDisabled;
            }
        });
    });

    return form;
}