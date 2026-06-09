export function createAuthFooter() {
    const footer = document.createElement("div");
    footer.className = "auth-footer";

    const text = document.createElement("p");
    text.textContent = "© Team Malmö & Co. Med ensamrätt.";

    footer.append(text);

    return footer;
}