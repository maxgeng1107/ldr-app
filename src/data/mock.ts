export type Person = { name: string; timezone: string };

export const me: Person = { name: "Max", timezone: "America/Los_Angeles" };
export const partner: Person = { name: "TA", timezone: "Europe/London" };

export type Slot = { start: string; end: string };   // UTC ISO strings

export const overlapSlots: Slot[] = [
  { start: "2026-10-01T03:00:00Z", end: "2026-10-01T04:30:00Z" },  // LA 8:00 PM / Shanghai 11:00 AM
  { start: "2026-10-02T02:00:00Z", end: "2026-10-02T03:00:00Z" },  // LA 7:00 PM / Shanghai 10:00 AM
  { start: "2026-10-03T15:00:00Z", end: "2026-10-03T16:00:00Z" },  // LA 8:00 AM / Shanghai 11:00 PM
];