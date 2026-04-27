# Rinse 🚿

A personal shower tracking app built as a full-stack portfolio project. Users can schedule showers, track streaks, set timers, and write notes about their shower days.

**Live demo:** [take-a-shower.vercel.app](https://take-a-shower.vercel.app/)  
**Demo account:** username `demo` / password `demo1234`

---

## Features

- **Countdown ring** - circular progress timer showing time until next scheduled shower
- **Shower scheduling** - choose between daily, every other day, or every two days
- **Calendar** - view and override individual shower days, mark days as missed
- **Shower notes** - right-click any calendar day to write notes about that shower
- **Timer** - circular countdown timer with custom duration, sound alert on finish
- **Streak tracking** - 7-day streak bar showing consecutive shower days
- **Notifications** - in-app toast notifications when timers complete
- **Auth** - username/password authentication with persistent sessions

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI (Python) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Architecture
React (Vercel)
↓ HTTP requests
FastAPI (Railway)
↓ reads/writes
Supabase (Postgres + Auth)

The browser never talks to Supabase directly - all requests go through FastAPI, which verifies the user's JWT token on every protected route before touching the database. Row Level Security on Supabase provides a second layer of protection.

---

## Project structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx        # sign in / sign up
│   │   ├── CalendarModal.tsx    # calendar with overrides + notes
│   │   ├── ScheduleModal.tsx    # schedule picker
│   │   ├── TimerModal.tsx       # shower timer
│   │   ├── Modal.tsx            # reusable modal shell
│   │   └── Toast.tsx            # in-app notifications
│   ├── hooks/
│   │   ├── useCountdown.ts      # main countdown logic
│   │   ├── useTimer.ts          # shower timer logic
│   │   └── audio.ts             # web audio api sounds
│   ├── lib/
│   │   ├── api.ts               # all fetch calls
│   │   └── utils.ts             # date math, schedule logic
│   └── types/
│       └── index.ts             # TypeScript interfaces
│
backend/
├── main.py                      # FastAPI routes
└── supabase_client.py           # Supabase connection
```

---

## Database schema

```sql
profiles          -- username, schedule, shower time
shower_overrides  -- manual calendar day toggles
shower_notes      -- per-day shower notes
shower_logs       -- shower history (future use)
```

---

## Running locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Add a `.env` file:
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_service_role_key

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Key concepts

**Custom hooks** - all stateful logic lives in `useCountdown` and `useTimer`, keeping components clean and focused on rendering.

**Optimistic updates** - calendar toggles update the UI instantly and save to the database in the background. If the save fails, the UI rolls back.

**Lifting state up** - shared state (schedule, overrides, notes) lives in `App.tsx` and flows down to components as props. Changes flow back up via callback functions.

**JWT auth** - Supabase issues a token on login which is stored in localStorage and sent as a Bearer token on every API request. FastAPI verifies it before any route runs.

---

## What I'd add next

- Shower history screen with stats and charts
- Push notifications for upcoming showers
- Multiple shower schedules (morning and evening)
- Mobile app via React Native

## Demo

[![Rinse Demo](https://img.youtube.com/vi/tOK52YyN1oI/maxresdefault.jpg)](https://www.youtube.com/watch?v=tOK52YyN1oI)