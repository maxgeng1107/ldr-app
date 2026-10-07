
export function formatTime(timeZone: string, now: Date, showSeconds: boolean=true): string{
    return new Intl.DateTimeFormat("en-US",{
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        second: showSeconds ? "2-digit" : undefined,
    }).format(now);
}


export function clockAngles(timeZone: string, now: Date):{ hour: number; 
    minute: number; second: number}{
    const FULLCYCLE = 360;
    const SEC_CYCLE = 60;
    const MIN_CYCLE = 60;
    const HOUR_CYCLE = 12;

    const parts = new Intl.DateTimeFormat("en-US",{
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(now);
    const h = Number(parts.find((p)=>p.type==="hour")?.value ?? 0);
    const m = Number(parts.find((p)=>p.type==="minute")?.value ?? 0);
    const s = Number(parts.find((p)=>p.type==="second")?.value ?? 0);
 
    const angle_hour = (FULLCYCLE/HOUR_CYCLE) * (h % HOUR_CYCLE)
        + ((FULLCYCLE/HOUR_CYCLE)/MIN_CYCLE) * m;
    const angle_minute = (FULLCYCLE/MIN_CYCLE) * m
        + ((FULLCYCLE/MIN_CYCLE)/SEC_CYCLE) * s;
    const angle_second = (FULLCYCLE/SEC_CYCLE) * s;
    return {hour: angle_hour, minute: angle_minute, second: angle_second};
}