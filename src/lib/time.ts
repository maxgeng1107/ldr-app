
export function formatTime(timeZone: string, now: Date): string{
    return new Intl.DateTimeFormat("en-US",{
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    }).format(now);
}