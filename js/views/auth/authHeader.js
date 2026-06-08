export function createAuthHeader({ isLogin }) {
    const header = document.createElement("div");
    header.className = "auth-header";

    const logo = document.createElement("div");
    logo.className = "auth-logo";
    logo.textContent = "L";

    const kicker = document.createElement("p");
    kicker.className = "auth-kicker";
    kicker.textContent = "Lianer Workspace";

    const title = document.createElement("h1");
    title.id = "authTitle";
    title.textContent = isLogin ? "Logga in" : "Skapa konto";

    const subtitle = document.createElement("p");
    subtitle.className = "auth-subtitle";
    subtitle.textContent = isLogin
        ? "Fortsätt till din arbetsyta och synka dina aktiviteter."
        : "Skapa ett konto för att börja använda Lianer med backend-synk.";

    header.append(logo, kicker, title, subtitle);

    return header;
}