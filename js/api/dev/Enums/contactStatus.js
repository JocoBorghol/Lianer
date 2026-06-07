export const ContactStatus = Object.freeze({
    EJ_KONTAKTAD: 0,
    PAGAENDE: 1,
    KLAR: 2,
    FORLORAD: 3,
    ATERKOM: 4
});

export const ContactStatusLabel = Object.freeze({
    [ContactStatus.EJ_KONTAKTAD]: "Ej kontaktad",
    [ContactStatus.PAGAENDE]: "Pågående",
    [ContactStatus.KLAR]: "Klar",
    [ContactStatus.FORLORAD]: "Förlorad",
    [ContactStatus.ATERKOM]: "Återkom"
});

export function getContactStatusLabel(status) {
    return ContactStatusLabel[status] ?? "Okänd";
}

export function mapContactStatusLabelToContactStatus(label) {
    switch (label) {
        case "Ej kontaktad":
            return ContactStatus.EJ_KONTAKTAD;

        case "Pågående":
            return ContactStatus.PAGAENDE;

        case "Klar":
            return ContactStatus.KLAR;

        case "Förlorad":
            return ContactStatus.FORLORAD;

        case "Återkom":
            return ContactStatus.ATERKOM;

        default:
            throw new Error(`Unknown contact status label: ${label}`);
    }
}