# LDR App — a shared space for couples in different time zones

> 🚧 **Work in progress.** This is the first version, built as a learning project. This README describes what works *today* and what is planned — nothing more.

## The idea

Long-distance couples constantly do time-zone math in their heads: *"Is it 2 AM for her? Is she in class?"*
This app gives two people one shared screen that answers three questions at a glance:

1. **What time is it for my partner right now** — and are they likely asleep?
2. **When are we both free to call today?** — computed automatically from each person's weekly availability.
3. **What is my partner doing?** — a simple shared status (planned).

Most existing long-distance apps focus on novelty features (drawing widgets, distance counters, virtual rooms). This project focuses on the one problem that time zones actually create: **finding time to talk.**

## Current status

| Feature | Status |
|---|---|
| Screen structure: Login → Home ↔ Best Call Time (Expo Router, stack navigation) | ✅ done |
| Home: dual-clock layout | 🟡 UI only, mock data |
| Best Call Time: list of overlapping call windows | 🟡 UI only, mock data (UTC ISO strings) |
| Email sign-up / log-in (Supabase Auth) | ⏳ planned |
| Pairing two accounts with an invite code | ⏳ planned |
| Live clocks from each user's IANA time zone | ⏳ planned |
| **Overlap algorithm** — intersect two people's weekly free slots across time zones, DST-safe, with unit tests | ⏳ planned (core technical piece) |
| Shared status with real-time updates | ⏳ optional |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | React Native + Expo (SDK 57), TypeScript | One codebase for iOS and Android; TypeScript catches type errors at compile time |
| Navigation | Expo Router | File-based routing — each file in `src/app/` is a screen |
| Backend (planned) | Supabase — PostgreSQL, Auth, Realtime | No custom server needed for an MVP; relational data fits users → couples → availability; row-level security keeps each couple's data private |
| Time handling (planned) | Store moments in UTC, users' zones as IANA names (e.g. `America/Los_Angeles`) | Offsets like `UTC-8` change with daylight saving; IANA names don't |

## Project structure

```
src/
├── app/                 # every file here is a screen (Expo Router)
│   ├── _layout.tsx      # root Stack navigator: headers, back navigation
│   ├── index.tsx        # Login (first screen)
│   ├── home.tsx         # dual clock
│   └── call-time.tsx    # best call windows
└── data/
    └── mock.ts          # mock users and UTC call slots (replaced by Supabase later)
```

## Run it locally

Requires Node.js and the Expo Go app on your phone.

```bash
npm install
npx expo start
```

Scan the QR code with your phone camera (iOS) or the Expo Go app (Android).

## Next steps

- Supabase authentication and invite-code pairing
- Overlap algorithm as a pure function in `src/lib/`, covered by Jest tests (no overlap, overlap across midnight, DST switch day, touching slots)
- Design decisions log in `docs/decisions.md`

---

Built by [Max Geng](https://github.com/maxgeng1107).
