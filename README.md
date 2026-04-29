# HEALTH AI

HEALTH AI, mühendisler ile sağlık profesyonellerini aynı platformda buluşturarak disiplinler arası proje ortaklıkları kurulmasını hedefleyen bir co-creation platformudur.

Repo iki ana uygulamadan oluşur:

- `frontend/`: React, TypeScript ve Vite tabanlı SPA.
- `backend/`: Node.js, Express, Prisma ve PostgreSQL tabanlı API.

Frontend ve backend artık **tam entegre** çalışır. Varsayılan mod gerçek API üzerinden çalışan modedir; `VITE_USE_MOCK_DATA=true` bayrağı offline demo / unit test için mock veriye dönüş kapısını açık tutar.

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Hızlı Başlangıç (Docker — önerilen)](#hızlı-başlangıç-docker--önerilen)
- [Frontend Komutları](#frontend-komutları)
- [Backend Komutları](#backend-komutları)
- [Mock ve Gerçek API Modu](#mock-ve-gerçek-api-modu)
- [Demo Hesapları](#demo-hesapları)
- [Proje Yapısı](#proje-yapısı)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Test](#test)
- [HTTPS / Caddy Notları](#https--caddy-notları)
- [CAPTCHA Stratejisi](#captcha-stratejisi)

## Özellikler

- Rol bazlı kullanıcı deneyimi: `engineer`, `healthcare`, `admin`
- Public landing page + GDPR/KVKK uyumlu privacy ve terms sayfaları
- Email doğrulama, onboarding, profil tamamlama
- Proje ilanı oluşturma, status timeline (FR-43), auto-expiry (FR-15)
- NDA-zorunlu meeting request akışı (FR-31), slot proposal + accept/decline/cancel
- Bildirim merkezi
- Admin paneli: kullanıcılar, postlar, audit log filter + CSV export, hash-chain integrity verifier
- 30 dakikalık sliding session timeout (NFR-06), 72 saatlik hesap silme (NFR-10)
- SHA-256 zincirli audit log (FR-53), 24 ay retention
- Caddy + Let's Encrypt ile HTTPS terminator (NFR-04)
- Honeypot bot koruması ve auth-spesifik rate-limit (NFR-07, NFR-08)

## Teknoloji Yığını

### Frontend
React 18 · TypeScript · Vite · React Router · TanStack React Query · Tailwind CSS · shadcn/ui (Radix) · Three.js (`@react-three/fiber`) · Vitest + Testing Library

### Backend
Node.js 18+ · Express · Prisma · PostgreSQL · JWT · bcrypt · helmet · express-rate-limit · Winston · Morgan · node-cron · Jest + Supertest

## Hızlı Başlangıç (Docker — önerilen)

```bash
cp .env.example .env
# .env dosyasını aç ve JWT_SECRET üret:
#   openssl rand -hex 48
docker compose up --build
```

Servisler ayağa kalktığında:

- HTTPS: <https://localhost> (Caddy internal CA, browser self-signed uyarısı verecektir — kabul et)
- HTTP redirect: `http://localhost` → `https://localhost`
- DB: host `localhost:5434`, container `db:5432`

İlk migration ve seed otomatik koşmaz; container içinde tek seferlik yapmak için:

```bash
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

> **Not:** docker-compose `JWT_SECRET:?` zorunlu kılar — boş bırakırsan stack hata ile durur.

## Frontend Komutları

```bash
cd frontend
npm install
npm run dev        # Vite dev server, port 8080 (real-mode default)
npm run build      # Production build
npm run preview    # Production build önizleme
npm run lint       # ESLint
npm test           # Vitest tek seferlik test (mock-mode: 12/12)
npm run test:watch # Vitest watch mode
```

## Backend Komutları

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate    # İlk kurulumda
npm run db:seed       # 6 seed user (Demo123!) + 8 post + 3 meeting
npm run dev           # nodemon, port 5000

npm test              # Jest + Supertest (27/27)
npm run test:unit     # Yalnız audit-chain unit testleri
```

API route grupları:

- `/api/auth` — register / login / verify-email / refresh / logout / me
- `/api/posts` — list / mine / get / create / update / delete / status / mark-closed
- `/api/messages` — thread + send + accept-nda
- `/api/meetings` — list / create / accept / decline / cancel
- `/api/notifications` — list / read / read-all
- `/api/users/me` — profile / request-deletion / cancel-deletion / export
- `/api/admin` — users + posts + stats + metrics + suspend/reactivate/deactivate/verify-domain/hard-delete + audit-logs/export + audit-logs/verify-chain

Sağlık kontrolü: `GET /health`.

## Mock ve Gerçek API Modu

| Mod | Bayrak | Davranış |
|---|---|---|
| Real (default) | `VITE_USE_MOCK_DATA=false` | Tüm CRUD, auth, audit log gerçek backend'e gider. PlatformDataContext ilk yüklemede `/api/posts`, `/api/meetings`, `/api/notifications`, admin için ayrıca `/api/admin/users` + audit logs çeker. |
| Mock | `VITE_USE_MOCK_DATA=true` | UI tamamen `frontend/src/data/mockData.ts` ile çalışır. Geliştirme, demo, vitest senaryoları için. localStorage persistence açıktır. |

Bayrak `frontend/src/api/client.ts:isMockMode()` üzerinden okunur. Provider, mod fark etmez aynı `usePlatformData()` API'sini sunar.

## Demo Hesapları

Tüm seed hesapların ortak şifresi: **`Demo123!`**

| Rol | Email | Notlar |
|---|---|---|
| healthcare | ayse.kaya@hacettepe.edu.tr | Cardiology — p1, p7 sahibi |
| engineer | mehmet.demir@metu.edu.tr | ML / CV — p2, p6 sahibi |
| healthcare | elif.yilmaz@itu.edu.tr | Radyoloji — p4 sahibi |
| engineer | can.ozturk@bilkent.edu.tr | Embedded — p3, p8 sahibi |
| healthcare | zeynep.arslan@ege.edu.tr | Orthopedi — p5 sahibi |
| admin | admin@healthai.edu.tr | Platform yöneticisi |

## Proje Yapısı

```text
.
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma         # Aligned with frontend types (Apr 2026)
|   |   |-- seed.js               # 6 user + 8 post + 3 meeting (mockData mirror)
|   |   `-- migrations/
|   |-- src/
|   |   |-- jobs/sweeps.js        # node-cron: auto-expire + 72h hard-delete
|   |   |-- lib/prisma.js         # Singleton Prisma client
|   |   |-- middleware/
|   |   |   |-- auth.js           # JWT + sliding session
|   |   |   |-- auditLog.js       # Drop-in audit wrapper
|   |   |   `-- ...
|   |   |-- routes/
|   |   |   |-- auth.js posts.js messages.js meetings.js
|   |   |   `-- notifications.js users.js admin.js
|   |   |-- services/
|   |   |   |-- audit.js          # SHA-256 hash chain + verifier
|   |   |   |-- email.js          # 6 transactional templates
|   |   |   `-- ...
|   |   `-- index.js
|   |-- tests/                    # Jest + Supertest, 27 tests
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- api/                  # auth/posts/meetings/notifications/users/admin/transforms
|   |   |-- contexts/             # PlatformData (real/mock dual) + Auth + ChatDock
|   |   |-- lib/hash.ts           # Web Crypto SHA-256
|   |   |-- pages/                # 18 pages incl. VerifyEmail, Privacy, Terms
|   |   |-- test/
|   |   |   |-- app-flows.test.tsx
|   |   |   `-- new-pages.test.tsx
|   |   `-- App.tsx
|   |-- nginx.conf                # HSTS + security headers
|   `-- package.json
|-- Caddyfile                     # HTTPS reverse proxy
|-- docker-compose.yml
|-- .env.example                  # Top-level (JWT_SECRET, DOMAIN, ACME_EMAIL...)
`-- README.md
```

## Ortam Değişkenleri

Üst seviye `.env.example` dosyası docker-compose tarafından okunur.

```env
JWT_SECRET=                # ZORUNLU: openssl rand -hex 48
DOMAIN=localhost           # Caddy public hostname
ACME_EMAIL=admin@healthai.local
FRONTEND_URL=https://localhost,http://localhost:8080
VITE_API_URL=/api
VITE_APP_NAME=HEALTH AI
VITE_USE_MOCK_DATA=false
SMTP_HOST=                 # boş bırakılırsa email skip edilir
SMTP_USER=
SMTP_PASS=
DELETION_TTL_MS=259200000  # 72 saat (test için 60000)
ALLOW_UNVERIFIED=false
```

Backend kendi `.env`'ine kopyalamak isterseniz `backend/.env.example` daha ayrıntılı parametreler içerir (rate-limit pencereleri vb.).

Frontend `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME=HEALTH AI
VITE_USE_MOCK_DATA=false
```

## Test

```bash
# Frontend
cd frontend && npm test                  # 12/12 vitest

# Backend (postgres ayakta olmalı: docker compose up -d db)
cd backend && npm test                   # 27/27 jest + supertest
cd backend && npm run test:unit          # SHA-256 + chain primitives only
```

Backend testleri seed datasını kullanır ve mutate ettiği state'i `afterAll`'da geri yükler.

## HTTPS / Caddy Notları

Caddy reverse proxy:

- 80 → 443 redirect
- `/api/*` ve `/health` → backend container
- Diğer her şey → frontend nginx container
- HSTS, X-Content-Type-Options, Referrer-Policy header'ları
- `DOMAIN=public-host.example.com` set edilirse Let's Encrypt otomatik sertifika

Production gereksinimi: **JWT_SECRET ≥ 32 karakter ve placeholder olmamalı.** Backend boot anında runtime kontrolü ile fail eder.

## CAPTCHA Stratejisi

Şu anki implementasyon: **Honeypot field (option A)** — sıfır bağımlılık, sıfır UX maliyeti. `auth/login` ve `auth/register` route'larında `body('honeypot').isEmpty()` validator'ü çalışır; LoginPage / RegisterPage HTML formuna görünmez bir input ekler. Bot doldurursa 400 döner.

Math-CAPTCHA bileşeni de UX katmanında kalır — kullanıcıya "verify you are human" göstergesi olarak iki kat koruma sağlar.

reCAPTCHA varyantını uygulamak isterseniz:

1. Backend'e `GET /api/auth/captcha` endpoint'i ekleyin → `{challengeId, question}` üreterek 5dk TTL ile Map/Redis'te saklayın.
2. Frontend `Captcha.tsx`'i bu API'ye bağlayın; submit'te `{challengeId, answer}` body'ye ekleyin.
3. `auth.js` validator'üne `body('captchaAnswer').custom(verifyChallenge)` ekleyin.

Honeypot zaten mevcut olduğu için bu refactor tercihen production sürümünde görünür kullanıcı için yapılır; bot trafiği honeypot'la engellenir.
