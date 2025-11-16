# Finance Tracker

Full‑stack personal finance app with a Spotify‑inspired dark UI, built in JavaScript (no TS). It includes credentials auth with JWT, accounts, transactions, budgets, categories, analytics (forecast/anomalies/recommendations), real‑time chat (Socket.IO), CSV import/export, and toast‑driven UX.

Recruiter‑friendly highlights:
- Modern React (Next.js) + TailwindCSS + React Query + Recharts
- Node.js/Express API with Prisma + Postgres (Neon) and JWT auth
- Real‑time chat with presence/typing (Socket.IO)
- Themed UI, skeletons, optimistic updates, and global toasts
- Simple analytics: 14‑day history + 7‑day projection, anomaly flags, and actionable tips

---

## Project Structure

- frontend/ — Next.js (pages), TailwindCSS, React Query, Recharts, JWT client
- backend/ — Express (JS), Prisma (Postgres), Socket.IO, jobs (node‑cron)
- backend/prisma — Prisma schema and migrations

## Architecture Overview

- Auth: email/password → JWT. Token is stored in localStorage. Axios interceptor attaches `Authorization: Bearer <token>`.
- API: REST under `/api/*` using Express; `requireAuth` protects routes.
- Data: Postgres via Prisma. Core models: User, Account, Category, Transaction, Budget, Recommendation, ChatRoom, ChatMessage, Attachment, AuditLog.
- Realtime: Socket.IO server initialized in backend, used by `/chat`. Presence count and typing indicators are broadcast per room.
- Analytics (lightweight):
  - Forecast: builds last 14 days of daily totals + 7 day projection (avg of last 7 days).
  - Anomalies: flags large expenses (mean + 2σ) and duplicate‑looking transactions (same day/merchant/amount).
  - Recommendations: "percent‑of‑income" tip; UI renders readable text.
- UI/UX: Spotify‑like near‑black surfaces, green accents, animated background, skeleton loaders, optimistic updates, global toasts, and a persistent Insights widget visible across pages.

## Key Paths

- Frontend pages
  - `pages/index.js` — Dashboard cards (Forecast, Anomalies, Recommendations) + Generate tips
  - `pages/transactions/index.jsx` — List, search, single‑date filter, CSV import/export
  - `pages/accounts/index.jsx` — List/create with optimistic update
  - `pages/budgets/index.jsx` — List/create; inline category creation; cleaned UI
  - `pages/settings/index.jsx` — User settings (currency/locale/timezone)
  - `pages/chat/index.jsx` — Create room, join by code, presence, typing
  - `pages/auth/signin.jsx` / `pages/auth/signup.jsx` — Auth screens
  - `_app.jsx` — Providers (Auth, React Query, Toasts) + Header + Insights widget
- Frontend libs/components
  - `lib/api.js` — Axios instance, Authorization header
  - `lib/auth.js` — Auth context (login/signup/logout, token/user state)
  - `lib/analytics.js` — forecast/anomalies/recommendations API clients
  - `lib/toast.js` — Toast provider/hook
  - `lib/socket.js` — Socket.IO client factory
  - `components/Header.jsx` — Navigation with active state and logout
  - `components/InsightsWidget.jsx` — Persistent analytics summary
- Backend
  - `src/app.js` — Express app, security middlewares, error handler
  - `src/routes/index.js` — All API routes + `requireAuth`
  - `src/controllers/*` — Feature controllers (auth, transactions, budgets, analytics, chat, etc.)
  - `src/socket/index.js` — Socket.IO server with presence/typing
  - `src/jobs/recurring.js` — Example scheduled job hook (payments/reminders placeholder)

## Environment

Create `backend/.env` from `backend/.env.example` and set required vars:

- `DATABASE_URL` — Postgres connection (Neon recommended) with `sslmode=require`
- `JWT_SECRET` — random long string
- Optional: SMTP_* (if you add emails later)

Frontend (Vercel or local `.env.local`):
- `NEXT_PUBLIC_API_URL` — base URL of the backend (http://localhost:4000 in dev)

## Local Development

1) Install
```
cd backend && npm install
cd ../frontend && npm install
```

2) Database + Prisma
```
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

3) Run (two terminals)
```
# Terminal A
cd backend
npm run dev  # http://localhost:4000

# Terminal B
cd frontend
npm run dev  # http://localhost:3000
```

## Deployment (recommended stack)

- DB: Neon Postgres (serverless). Copy connection string → `DATABASE_URL`.
- Backend: Render Web Service.
  - Build: `npm i && npx prisma generate`
  - Start: `node src/index.js`
  - After first deploy: run `npx prisma migrate deploy` (one‑off job) to apply migrations.
  - Env: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
- Frontend: Vercel (Next.js).
  - Env: `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com`

## API Overview

Auth
- POST `/api/auth/signup` { name, email, password }
- POST `/api/auth/login` { email, password } → { token, user }

Transactions
- GET `/api/transactions?q&skip&take&dateFrom&dateTo`
- POST `/api/transactions` { accountId, amount, currency, date, merchant?, categoryId?, tags?, notes? }
- CSV Import/Export endpoints available

Budgets & Categories
- GET/POST `/api/budgets` and `/api/categories`; budgets summary used internally

Analytics
- GET `/api/analytics/forecast` → last 14 days + 7 day projection
- GET `/api/analytics/anomalies` → large/duplicate flags
- GET `/api/recommendations` → stored tips
- POST `/api/recommendations/generate` → create a tip for current data

Chat
- POST `/api/chat/rooms` → create; GET/POST messages per room; join by code with Socket.IO

## Feature Walkthrough

- Sign up/in → token stored → header shows user + Logout.
- Transactions → add/import; search; date filter (single date supported); skeletons while loading.
- Accounts/Budgets → create with optimistic UI + toasts; inline category creation in Budgets.
- Dashboard → Forecast (line chart), Anomalies (list), Recommendations (human‑readable). "Generate tips" triggers a recommendation.
- Insights Widget → persistent mini‑summary across pages with quick link back to dashboard.
- Chat → create/join private room by code; presence count and typing indicators.

## Design & UX

- Spotify‑inspired dark theme with green accents and animated radial gradients.
- Cards with soft borders and subtle elevation; hover and motion affordances.
- Global Toasts for feedback; skeleton loaders for perceived performance.
- Mobile‑first responsive layout; sticky insights widget for discoverability.

## Testing the Analytics

- Forecast: add 10–20 transactions spread across recent days; chart shows daily totals and projection.
- Anomalies: add a clear outlier (e.g., 5000) and an exact duplicate (same day/merchant/amount) to see flags.
- Recommendations: click "Generate tips" on the dashboard to create a savings tip based on your income.

## Security Considerations

- All protected endpoints use `requireAuth` JWT middleware.
- Centralized error handler with request IDs for traceability.
- Room listing disabled by default; chat join is by code for privacy.

## Roadmap Ideas

- Category‑aware anomaly thresholds and per‑budget over‑spend tips.
- Rule‑based recurring transactions; bank connection integrations.
- Advanced forecasting (seasonality) and budget utilization charts.

