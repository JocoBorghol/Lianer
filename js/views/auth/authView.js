import { authService } from "../../api/dev/Service/AuthService.js";
import { createAuthHeader } from "./authHeader.js";
import { createAuthForm } from "./authForm.js";
import { createAuthFooter } from "./authFooter.js";
import { getFullName, getAuthErrorMsg, getGoogleAuthErrorMsg } from "./authHelpers.js";
import { dispatchAuthSuccess } from "./authEvents.js";

const AUTH_MODES = Object.freeze({
    LOGIN: "login",
    REGISTER: "register"
});

export function renderAuthView() {
    const root = document.createElement("main");
    root.className = "auth-shell";
    root.setAttribute("aria-labelledby", "authTitle");

    let mode = AUTH_MODES.LOGIN;

    const card = document.createElement("section");
    card.className = "auth-card";
    card.setAttribute("aria-live", "polite");

    const render = () => {
        const isLogin = mode === AUTH_MODES.LOGIN;

        card.replaceChildren(
            createAuthHeader({ isLogin }),
            createAuthForm({
                isLogin,

                onSwitchMode: () => {
                    mode = isLogin ? AUTH_MODES.REGISTER : AUTH_MODES.LOGIN;
                    render();
                },

                onSubmit: async (payload, controls) => {
                    await handleAuthSubmit({
                        mode,
                        isLogin,
                        payload,
                        controls
                    });
                },

                onGoogleLogin: async (controls) => {
                    await handleGoogleLogin({ controls });
                }
            }),
            createAuthFooter()
        );
    };

    render();
    root.append(card);

    return root;
}

async function handleAuthSubmit({ mode, isLogin, payload, controls }) {
    controls.setMessage(isLogin ? "Loggar in..." : "Skapar konto...");
    controls.setDisabled(true);

    try {
        const result = isLogin
            ? await authService.login({
                email: payload.email,
                password: payload.password
            })
            : await authService.registerAndLogin({
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                password: payload.password
            });

        const user = result.user;
        const name = getFullName(user);

        controls.setMessage(
            name ? `Inloggad som ${name}.` : "Inloggning lyckades."
        );

        dispatchAuthSuccess({ mode, user });

    } catch (error) {
        console.error("Authentication failed:", error);
        controls.setMessage(getAuthErrorMsg(error));
    } finally {
        controls.setDisabled(false);
    }
}

async function handleGoogleLogin({ controls }) {
    controls.setMessage("Öppnar Google-inloggning...");
    controls.setDisabled(true);

    try {
        await authService.startGoogleLogin();
    } catch (error) {
        console.error("Google login failed:", error);
        controls.setMessage(getGoogleAuthErrorMsg(error));
        controls.setDisabled(false);
    }
}