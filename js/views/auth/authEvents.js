export function dispatchAuthSuccess({ mode, user }) {
    window.dispatchEvent(new CustomEvent("authFormSubmitted", {
        detail: {
            mode,
            user
        }
    }));

    window.dispatchEvent(new CustomEvent("authChanged", {
        detail: {
            isAuthenticated: true,
            user
        }
    }));
}