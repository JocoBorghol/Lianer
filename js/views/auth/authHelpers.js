export function getFullName(user) {
    if (!user) return "";

    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user.email || "";
}

export function getAuthErrorMsg(error) {
    const message = error?.message ?? "";

    if (message.includes("401")) {
        return "Fel e-post eller lösenord.";
    }

    if (message.includes("400")) {
        return "Kontrollera att alla fält är korrekt ifyllda.";
    }

    if (message.includes("Failed to fetch")) {
        return "Kunde inte nå backend. Kontrollera att API:t körs.";
    }

    return "Inloggningen misslyckades. Försök igen.";
}

export function getGoogleAuthErrorMsg(error) {
    const message = error?.message ?? "";

    if (message.includes("503")) {
        return "Google-inloggning är otillgängligt.";
    }

    if (message.includes("401")) {
        return "Google-token var ogiltig.";
    }

    if (message.includes("400")) {
        return "Google-inloggningen skickade ogiltig data.";
    }

    if (message.includes("Failed to fetch")) {
        return "Kunde inte nå backend för Google-inloggning.";
    }

    return "Google-inloggningen misslyckades.";
}