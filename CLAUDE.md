# CLAUDE.md — dail-game Project Source of Truth

## Project Overview

**dail-game** is a web app where users submit their daily Wordle and Parolla results.
It shows daily, weekly, and monthly leaderboards with normalized combined scoring.

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 15 (App Router)                       |
| UI         | Chakra UI v3                                  |
| Backend    | Node.js 22 + Express 4                        |
| Database   | MongoDB 7 + Mongoose 8                        |
| Auth       | JWT (access) + httpOnly cookie (refresh)      |
| i18n       | next-intl v4 — `[locale]` App Router routing  |
| Color mode | next-themes (Chakra UI v3 uyumu için)         |
| Deployment | Self-hosted VPS (Docker Compose / PM2)        |

## Repository Structure

```
dail-game/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx          # Root shell (minimal, no providers)
│   │       │   └── [locale]/           # Tüm sayfalar burada
│   │       │       ├── layout.tsx      # Providers + NextIntlClientProvider
│   │       │       ├── page.tsx
│   │       │       ├── login/
│   │       │       ├── leaderboard/
│   │       │       ├── history/
│   │       │       ├── games/
│   │       │       ├── entry/
│   │       │       ├── profile/
│   │       │       └── admin/
│   │       ├── components/
│   │       ├── i18n/
│   │       │   ├── routing.ts          # locales: ['en','tr'], prefix: as-needed
│   │       │   └── request.ts          # getRequestConfig
│   │       ├── lib/
│   │       │   ├── api.ts              # Axios client + token interceptor
│   │       │   └── navigation.ts       # createNavigation (next-intl)
│   │       ├── messages/
│   │       │   ├── en.json
│   │       │   └── tr.json
│   │       ├── middleware.ts           # next-intl middleware
│   │       ├── providers/
│   │       │   ├── AuthProvider.tsx
│   │       │   └── ChakraProvider.tsx  # useColorMode buradan export edilir
│   │       └── store/
│   │           └── authStore.ts
│   └── backend/
│       └── src/
│           ├── config/                 # env, db, gameConfig
│           ├── controllers/
│           ├── middleware/
│           ├── models/
│           ├── routes/
│           ├── services/
│           ├── utils/
│           └── validation/
├── packages/
│   └── types/                          # Shared TypeScript types
├── ecosystem.config.js
├── docker-compose.yml
├── CLAUDE.md
├── README.md
└── .env.example
```

## Architecture Decisions

### Monorepo
Single git repo, two deployable apps. Frontend and backend deploy separately on VPS.
Shared types package avoids type drift between client and server.

### Timezone Strategy
- All "daily" records are keyed to a **UTC date string** (`YYYY-MM-DD`).
- The server derives today's UTC date from `new Date().toISOString().slice(0, 10)`.
- Leaderboards are per UTC day. This is simple, consistent, and documented here.
- Future improvement: allow per-user timezone preference for display purposes only.

### i18n Mimarisi
- next-intl v4 + App Router entegrasyonu kullanılıyor.
- Sayfalar `src/app/[locale]/` altında — middleware locale'i URL'den okur.
- URL stratejisi: `localePrefix: 'as-needed'` → `/` (İngilizce, prefix yok), `/tr/` (Türkçe).
- `src/lib/navigation.ts` — `createNavigation(routing)` ile locale-aware `Link`, `useRouter`, `usePathname` export edilir. Tüm bileşenler `next/navigation` yerine buradan import eder.
- Dil değiştirme: `router.replace(pathname, { locale: 'tr' })` — URL'yi yeniden yazmadan locale cookie'sini günceller.
- Mevcut diller: `en` (varsayılan), `tr`. Yeni dil eklemek için: `routing.ts`'e ekle + `messages/<locale>.json` oluştur.

### Color Mode (Chakra UI v3)
- Chakra UI v3, color mode için `next-themes` gerektirir — kendi `useColorMode` hook'u v3'te plugin bağımsız çalışmaz.
- `src/providers/ChakraProvider.tsx` içinde `ThemeProvider` (next-themes) sarılmış ve `useColorMode` hook'u buradan export edilir.
- Bileşenler `@chakra-ui/react`'ten değil, `@/providers/ChakraProvider`'dan import eder.
- `optimizePackageImports: ['@chakra-ui/react']` Chakra ile uyumsuz — next.config.ts'de kullanılmıyor.

### Avatar Strategy (v1)
- URL-based only — users paste an image URL.
- No file uploads in v1. Eliminates upload attack surface.
- Avatar URL is validated to be a valid HTTPS URL before saving.

### Game Extensibility
- Games are defined in a `Game` collection (DB) and a `GAME_CONFIG` map (backend).
- Each game config specifies: `scoreFields`, `normalizer` function, `officialUrl`.
- Adding a new game = insert DB record + add config entry. No core logic changes.

---

## Scoring System

### Goal
Fair equal-weight (50/50) combination of Wordle and Parolla scores into a single daily score.

### Wordle Normalization
Wordle raw score = attempt number (1–6). Lower is better. DNF = 7 (worst).

```
wordle_normalized = (7 - attempt) / 6
```

| Attempt | Normalized |
|---------|-----------|
| 1       | 1.000     |
| 2       | 0.833     |
| 3       | 0.667     |
| 4       | 0.500     |
| 5       | 0.333     |
| 6       | 0.167     |
| DNF     | 0.000     |

### Parolla Normalization
Parolla raw scores: `correct`, `wrong`, `blank` (must sum to total tiles = 16 in standard Parolla).
The formula does not assume a fixed total — it derives it dynamically.

```
total = correct + wrong + blank
parolla_normalized = correct / total   (if total = 0, result = 0)
```

Range: [0.0, 1.0]. Higher = better.

### Combined Daily Score

```
daily_score = (wordle_normalized × 0.5) + (parolla_normalized × 0.5)
```

Range: [0.0, 1.0]. Used for the **total daily leaderboard**.

### Leaderboard Ranking
- Per-game leaderboards use the game's own normalized score.
- Total leaderboard uses `daily_score`.
- Ties are broken by entry `createdAt` (earlier submission wins).
- If a user submits only one game, they receive 0 for the missing game in the total score.

### Justification
Linear normalization maps each game's raw scores to [0,1] with equal weight.
Wordle's ordinal scale (1–6 attempts) maps cleanly to a linear progression.
Parolla's ratio score (correct/total) is naturally [0,1].
Neither formula requires external calibration or historical data.

---

## Data Models

### User
```
_id, email, displayName, passwordHash, role (admin|user),
avatarUrl, createdAt, updatedAt, createdBy (admin userId)
```

### Game
```
_id, slug (wordle|parolla), name, officialUrl,
scoreFields: [{name, type, label}], isActive, createdAt, updatedAt
```

### DailyEntry
```
_id, userId, gameId, date (YYYY-MM-DD UTC), scores: {}, 
normalizedScore, createdAt, updatedAt, updatedBy
unique index: (userId, gameId, date)
```

### RefreshToken
```
_id, userId, tokenHash, expiresAt, createdAt, revokedAt, userAgent, ip
```

---

## Auth / Session Strategy

- **Access token**: JWT, 15-minute TTL, signed with `ACCESS_TOKEN_SECRET`.
  Sent in `Authorization: Bearer <token>` header.
- **Refresh token**: Opaque random token, 7-day TTL, stored hashed in DB.
  Sent in `httpOnly; Secure; SameSite=Strict` cookie named `__refresh`.
- **Rotation**: On every `/auth/refresh` call, old token is revoked and a new one issued.
- **Logout**: Revokes the current refresh token in DB + clears cookie.
- **RBAC**: Middleware checks `req.user.role`. Admin routes require `role === 'admin'`.

---

## API Route Map

```
POST   /api/auth/login          # Public
POST   /api/auth/logout         # Auth
POST   /api/auth/refresh        # Public (uses cookie)

GET    /api/users/me            # Auth
PATCH  /api/users/me            # Auth (displayName, avatarUrl)

GET    /api/games               # Public
GET    /api/games/:slug         # Public

GET    /api/entries             # Auth (own entries)
POST   /api/entries             # Auth (submit daily entry)
GET    /api/entries/:id         # Auth

GET    /api/leaderboard/daily   # Public ?date=YYYY-MM-DD
GET    /api/leaderboard/weekly  # Public ?week=YYYY-Www
GET    /api/leaderboard/monthly # Public ?month=YYYY-MM

# Admin routes
GET    /api/admin/users         # Admin
POST   /api/admin/users         # Admin (create user)
PATCH  /api/admin/users/:id     # Admin
DELETE /api/admin/users/:id     # Admin (soft delete)

GET    /api/admin/entries       # Admin
PATCH  /api/admin/entries/:id   # Admin (edit any entry)

GET    /api/admin/stats         # Admin dashboard stats
```

---

## UI Page Map

```
/                    → Home (daily leaderboard + top scores widget)
/login               → Login form
/leaderboard         → Full leaderboard (daily/weekly/monthly tabs)
/history             → Historical scores browser (date + game filters)
/games               → Game links page (official URLs)
/profile             → Profile page (displayName, avatar)
/entry               → Daily entry form (select game, enter score)
/admin               → Admin dashboard
/admin/users         → User management
/admin/users/new     → Create user
/admin/entries       → Entry management (edit/view)
```

---

## Security Checklist

- [x] bcrypt password hashing (rounds ≥ 12)
- [x] httpOnly + Secure + SameSite=Strict refresh cookie
- [x] JWT access token, short TTL (15min)
- [x] Refresh token rotation (old token revoked on use)
- [x] Rate limiting on `/api/auth/*` (express-rate-limit)
- [x] Helmet.js for secure headers
- [x] CORS restricted to frontend origin
- [x] Input validation: Zod on backend, Zod on frontend forms
- [x] Mongoose unique index for (userId, gameId, date)
- [x] Role-based middleware on admin routes
- [x] Avatar URL validated as HTTPS URL (no file upload)
- [x] Sensitive errors never forwarded to client (generic 500 messages)
- [x] No secrets in source code — all via environment variables
- [x] `.env` in `.gitignore`

---

## Threat Model (Short)

| Threat | Mitigation |
|--------|-----------|
| Brute-force login | Rate limit on /auth/login (5 req/15min) |
| Token theft (XSS) | Access token in memory only; refresh in httpOnly cookie |
| CSRF on cookie-based refresh | SameSite=Strict cookie; CSRF token optional for v2 |
| Refresh token replay | DB-stored hash; rotation invalidates old token immediately |
| Duplicate daily entry | DB unique compound index (userId, gameId, date) |
| Privilege escalation | Role checked server-side on every protected route |
| Malicious avatar URL | Validated HTTPS URL; no file execution |
| Score manipulation | All normalization done server-side; client sends raw scores only |
| Data enumeration | User list is admin-only; public endpoints show display names only |

---

## Environment Variables

See `.env.example` for full list. Required vars:
- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_DISPLAY_NAME`
- `FRONTEND_URL`

---

## Seed

Run `npm run seed` from `apps/backend` to:
1. Create the admin user from env vars.
2. Insert the initial Game documents (Wordle, Parolla).

Seed is idempotent — safe to run multiple times.

---

## Phase Log

| Phase | Status | Description |
|-------|--------|-------------|
| 1     | ✅ Done | Architecture, design, CLAUDE.md |
| 2     | ✅ Done | Monorepo scaffold, TypeScript config, shared types, env, Dockerfiles |
| 3     | ✅ Done | DB models (User/Game/DailyEntry/RefreshToken), seed, full auth API, admin APIs |
| 4     | ✅ Done | Next.js setup, Chakra UI v3 theme, auth store, login, profile, admin UI |
| 5     | ✅ Done | Entry forms, leaderboard (daily/weekly/monthly), history, games pages |
| 6     | ✅ Done | Zod validation, rate limiting, helmet, CORS, DB indexes, error handling |
| 7     | ✅ Done | README, .env.example, seed instructions, API summary, PM2/Docker deploy |
| 8     | ✅ Done | next-intl v4 `[locale]` routing, TR/EN dil değiştirici, tablo raw score sütunu, next-themes color mode |

## Önemli Notlar / Pitfalls

- **`useColorMode`** — `@chakra-ui/react`'ten import edilmez. `@/providers/ChakraProvider`'dan import edilir.
- **`Link`, `useRouter`, `usePathname`** — `next/navigation`'dan değil, `@/lib/navigation`'dan import edilir (locale-aware olması için).
- **`optimizePackageImports`** — Chakra UI v3 ile uyumsuz, `next.config.ts`'de aktif edilmemeli.
- **`useTranslations`** — Hem server hem client component'larda çalışır. `[locale]/layout.tsx` içindeki `NextIntlClientProvider` sayesinde provider zinciri kurulu.
- **Mongoose duplicate index** — `unique: true` zaten index oluşturur; `schema.index({ email: 1 })` ayrıca yazılmamalı.
- **next-intl plugin** — `next.config.ts`'de `createNextIntlPlugin` ve `src/i18n/request.ts` birlikte olmak zorunda. Biri eksik olursa "Couldn't find next-intl config file" hatası gelir.

---

## Package Choice Justifications

| Package | Justification |
|---------|--------------|
| bcryptjs | Pure-JS bcrypt — no native bindings, works everywhere, rounds=12 |
| jsonwebtoken | Industry-standard JWT library, actively maintained |
| express-rate-limit | Composable, production-tested rate limiter for Express |
| helmet | Comprehensive security headers in one middleware |
| zod | TypeScript-first schema validation; single source of truth for DTO + type inference |
| mongoose 8 | Mature MongoDB ODM, strong TypeScript support |
| next-intl v4 | App Router native i18n; `[locale]` routing, server + client component support |
| next-themes | Chakra UI v3'ün color mode sistemi next-themes gerektirir; kendi hook'u plugin bağımlı |
| @chakra-ui/react v3 | Ark UI tabanlı, daha iyi performans ve theming; semantic token sistemi |
| react-hook-form | Performant, uncontrolled forms; integrates with Zod via @hookform/resolvers |
| axios | Interceptor support for access token refresh; cleaner than raw fetch for client API calls |
| zustand | Minimal client state for auth; no boilerplate, works with SSR |

## VPS Deployment

### Process Manager
Use **PM2** to run both apps as daemons.

```bash
# Backend
pm2 start apps/backend/dist/server.js --name dail-game-api

# Frontend (Next.js production)
pm2 start npm --name dail-game-web -- start --prefix apps/frontend
```

### Reverse Proxy (Nginx assumed)
```nginx
# /etc/nginx/sites-available/dail-game
server {
  server_name yourdomain.com;

  location /api/ {
    proxy_pass http://localhost:5000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Build Steps
```bash
# 1. Clone and install
git clone <repo> && cd dail-game
npm install

# 2. Set env vars
cp .env.example apps/backend/.env
cp .env.example apps/frontend/.env.local
# Edit both files with production values

# 3. Build
npm run build

# 4. Seed DB (first time only)
cd apps/backend && npm run seed

# 5. Start with PM2
pm2 start ecosystem.config.js
```

### Environment Variables (Required on VPS)
Backend:
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=mongodb://...`
- `ACCESS_TOKEN_SECRET=<64-char random>`
- `REFRESH_TOKEN_SECRET=<64-char random>`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`
- `FRONTEND_URL=https://yourdomain.com`

Frontend:
- `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`

---

## Future Extension Points

1. **New games**: Add to `Game` collection + add config to `GAME_CONFIG` map in `gameConfig.ts`. No schema changes needed.
2. **New languages**: Add `messages/<locale>.json` and update `next-intl` config.
3. **File upload avatars**: Add `multer` + S3/local storage; replace URL validation with upload endpoint.
4. **Email notifications**: Plug into a queue (BullMQ) on entry submission.
5. **Timezone per user**: Store in User model; adjust date display client-side only.
6. **CSRF protection**: Add `csurf` or double-submit cookie pattern for refresh endpoint.
7. **OAuth login**: Add `passport.js` strategy; no schema changes needed (add `oauthId` field).
8. **Score history charts**: Add charting library (Recharts) to history page.

---

## Known Assumptions

1. Parolla total tiles = `correct + wrong + blank` (dynamic, not hardcoded to 16).
2. Users cannot self-register; admin creates all accounts.
3. "Weekly" leaderboard = ISO week (Monday–Sunday).
4. All timestamps stored in UTC. Display timezone = UTC for v1.
5. DNF in Wordle is represented as `attempt = 7` in the DB.
6. Avatar is URL-only in v1; file upload deferred.
7. No email verification flow in v1 (admin-managed accounts).
