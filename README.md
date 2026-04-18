# Take-a-shower

## File Structure

```
src/
├── types/
│   └── index.ts          ← TypeScript interfaces (User, UserProfile, ScheduleInterval, etc.)
│
├── lib/
│   └── utils.ts          ← Pure helper functions (date math, ring math, formatting)
│
├── hooks/
│   ├── useCountdown.ts   ← Custom hook: manages the main countdown ring + streak
│   └── useTimer.ts       ← Custom hook: manages the shower timer (start/pause/reset)
│
├── components/
│   ├── LoginPage.tsx      ← Sign in / sign up screen
│   ├── LoginPage.module.css
│   ├── Modal.tsx          ← Reusable modal shell (backdrop + card + close button)
│   ├── Modal.module.css
│   ├── CalendarModal.tsx  ← Calendar with shower day highlights + toggles
│   ├── CalendarModal.module.css
│   ├── ScheduleModal.tsx  ← Pick schedule (daily / every other / every two days)
│   ├── ScheduleModal.module.css
│   ├── TimerModal.tsx     ← Shower timer with ring display
│   └── TimerModal.module.css
│
├── App.tsx               ← Root component: owns all shared state, renders everything
└── App.css               ← Global styles for the main app screen layout
```
 
## Key concepts used
 
- **Custom hooks** (`useCountdown`, `useTimer`) — pull complex stateful logic out of components
- **Lifting state up** — shared data (schedule, overrides, user) lives in App.tsx
- **CSS Modules** — scoped class names, one .module.css per component
- **Controlled inputs** — React owns input values via useState
- **useCallback** — memoizes functions passed as props to avoid unnecessary re-renders
- **Cleanup functions** in useEffect — always clear intervals/listeners on unmount