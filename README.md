# LDR App — a private shared space for long-distance couples

> 🚧 **Work in progress.** This is the first version, built as a learning project. This README describes what works *today* and what is planned — nothing more.

## The idea

Long-distance couples live in two time zones and two separate days. This app gives a paired couple one private space that answers:

1. **What time is it for my partner right now?** — live local clocks from each person's time zone.
2. **What have we shared?** — a private photo timeline that starts from the day you got together.
3. **When is my partner busy?** — each person records busy times (one-off or daily), so the other knows when not to call.

Most existing long-distance apps focus on novelty features (drawing widgets, distance counters, virtual rooms). This project keeps to a small set of features that two people would actually open every day, and puts the engineering effort into **pairing, data privacy, and correct time-zone handling.**

## Current status

| Feature | Status |
|---|---|
| Screen structure with Expo Router (Login → Home → Call Time) | ✅ done |
| Email sign-up / sign-in with Supabase Auth, user-friendly error messages | ✅ done |
| Profile row created automatically at sign-up (database trigger) with name + device-detected IANA time zone | ✅ done |
| Home shows my real name and live local time from my profile | ✅ done |
| Pairing two accounts with an invite code | ⏳ in progress |
| Home shows partner's name and live local time | ⏳ planned (needs pairing) |
| Row-level security: a couple's data is visible only to its two members | ⏳ planned |
| Photo timeline — pick photos, upload to private storage, show newest first | ⏳ planned |
| Busy times — one-off and daily, stored in UTC, shown in each person's local time | ⏳ planned |
| Session persistence across app restarts | ⏳ planned |
| Best Call Time — overlap of both people's free time, DST-safe, with unit tests | 🟡 screen exists with mock data; algorithm planned after MVP |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | React Native + Expo (SDK 57), TypeScript | One codebase for iOS and Android; TypeScript catches type errors at compile time |
| Navigation | Expo Router | File-based routing — each file in `src/app/` is a screen |
| Backend | Supabase — PostgreSQL, Auth, Storage | No custom server needed for an MVP; relational data fits users → couples → photos; row-level security keeps each couple's data private |
| Time handling | Store moments in UTC (`timestamptz`), users' zones as IANA names (e.g. `America/Los_Angeles`) | Offsets like `UTC-8` change with daylight saving; IANA names don't |

## Data model

```
auth.users            (managed by Supabase Auth: email, password hash)
   │ 1:1, created by trigger on sign-up
   ▼
users      (id, name, timezone, couple_id)
   │ many:1
   ▼
couples    (id, pair_code, start_date)
   │ 1:many
   ├── photos (id, couple_id, uploaded_by, storage_path, created_at)     — planned
   └── busy   (id, user_id, starts_at, ends_at, repeat)                   — planned
```

- `auth.users` is not exposed to the app; `public.users` holds the profile the app reads.
- `couple_id` is set only by a database function during pairing, never directly by the client.
- Photos will live in a **private** Storage bucket; the table stores the object path, not a public URL.

## Project structure

```
src/
├── app/                 # every file here is a screen (Expo Router)
│   ├── _layout.tsx      # root Stack navigator
│   ├── index.tsx        # sign-in / sign-up (first screen)
│   ├── home.tsx         # my profile + live local time
│   ├── call-time.tsx    # best call windows (mock data)
│   └── db-test.tsx      # Supabase connection smoke test
├── lib/
│   ├── supabase.ts      # shared Supabase client
│   └── time.ts          # formatTime() with Intl.DateTimeFormat
└── data/
    └── mock.ts          # mock data, removed as screens move to Supabase
```

## Run it locally

Requires Node.js, the Expo Go app on your phone, and a Supabase project.

1. Create `.env.local` in the project root (it is git-ignored):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=<your publishable key>
   ```

   Only the **publishable** key belongs in the app. Never put a secret / service-role key here.

2. Install and start:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code with your phone camera (iOS) or the Expo Go app (Android).

## Next steps

- Invite-code pairing through a single database function (atomic, rejects a third member)
- Row-level security policies for every table, verified with two paired accounts and one outsider
- Photo timeline with private Supabase Storage
- Busy times (one-off + daily)
- Database schema as a reproducible `supabase/schema.sql`
- After MVP: overlap algorithm as a pure function in `src/lib/`, covered by Jest tests (no overlap, overlap across midnight, DST switch day, touching slots)

---

Built by [Max Geng](https://github.com/maxgeng1107).
