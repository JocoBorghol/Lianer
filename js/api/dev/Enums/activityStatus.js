export const ActivityStatus = Object.freeze({
    PENDING: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    CANCELLED: 3,
    ON_HOLD: 4
});

export const ActivityStatusLabel = Object.freeze({
    [ActivityStatus.PENDING]: "Att göra",
    [ActivityStatus.IN_PROGRESS]: "Pågår",
    [ActivityStatus.COMPLETED]: "Klar",
    [ActivityStatus.CANCELLED]: "Stängd",
    [ActivityStatus.ON_HOLD]: "Pausad"
});

export function getActivityStatusLabel(status) {
    return ActivityStatusLabel[status] ?? "Okänd";
}

export function mapTaskStatusLabelToActivityStatus(label) {
    switch (label) {
        case "Att göra":
            return ActivityStatus.PENDING;

        case "Pågår":
            return ActivityStatus.IN_PROGRESS;

        case "Klar":
            return ActivityStatus.COMPLETED;

        case "Stängd":
            return ActivityStatus.CANCELLED;

        case "Pausad":
            return ActivityStatus.ON_HOLD;

        default:
            throw new Error(`Unknown task status label: ${label}`);
    }
}