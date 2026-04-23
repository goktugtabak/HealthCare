# HEALTH AI

HEALTH AI, mühendisler ile sağlık profesyonellerini aynı platformda buluşturarak disiplinler arası proje ortaklıkları kurulmasını hedefleyen bir co-creation platformudur.

Repo iki ana uygulamadan oluşur:

- `frontend/`: React, TypeScript ve Vite tabanlı SPA.
- `backend/`: Node.js, Express, Prisma ve PostgreSQL tabanlı API.

Frontend şu an varsayılan olarak mock data ile çalışır. Bu nedenle arayüzü çalıştırmak için backend veya veritabanı başlatmak zorunlu değildir.

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Frontend Komutları](#frontend-komutları)
- [Backend Komutları](#backend-komutları)
- [Docker ile Çalıştırma](#docker-ile-çalıştırma)
- [Mock ve Gerçek API Modu](#mock-ve-gerçek-api-modu)
- [Proje Yapısı](#proje-yapısı)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Test](#test)

## Özellikler

- Rol bazlı kullanıcı deneyimi: `engineer`, `healthcare`, `admin`
- Public landing page
- Giriş, kayıt ve onboarding akışları
- Dashboard ve proje keşif ekranları
- Proje ilanı oluşturma, düzenleme ve detay sayfaları
- Toplantı istekleri, bildirimler ve profil ekranları
- Admin paneli: kullanıcılar, gönderiler, loglar ve istatistikler
- Mock-first frontend geliştirme akışı
- JWT tabanlı backend kimlik doğrulama altyapısı
- Prisma ile PostgreSQL veri modeli

## Teknoloji Yığını

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- TanStack React Query
- Tailwind CSS
- shadcn/ui ve Radix UI
- Three.js, `@react-three/fiber`, `@react-three/drei`
- Vitest ve Testing Library

### Backend

- Node.js 18+
- Express
- Prisma
- PostgreSQL
- JWT
- bcrypt
- helmet, cors, express-rate-limit
- Winston ve Morgan logging
- Jest ve Supertest

## Hızlı Başlangıç

Sadece frontend arayüzünü görmek için:

```bash
cd frontend
npm install
npm run dev
```

Uygulama varsayılan olarak şu adreste çalışır:

```text
http://localhost:8080
```

Frontend mock data kullandığı için bu adım backend veya veritabanı gerektirmez.

## Frontend Komutları

```bash
cd frontend
npm run dev        # Vite dev server, port 8080
npm run build      # Production build
npm run preview    # Production build önizleme
npm run lint       # ESLint
npm test           # Vitest tek seferlik test
npm run test:watch # Vitest watch mode
```

## Backend Komutları

Backend için PostgreSQL bağlantısı gerekir. Örnek ortam dosyasını kopyalayarak başlayın:

```bash
cd backend
copy .env.example .env
npm install
npm run db:generate
npm run dev
```

Kullanılabilir komutlar:

```bash
npm run dev              # nodemon ile geliştirme sunucusu
npm start                # production başlangıcı
npm test                 # Jest unit testleri
npm run test:integration # Integration testleri
npm run db:migrate       # Prisma migrate dev
npm run db:generate      # Prisma client üretimi
npm run db:seed          # Seed data
npm run db:studio        # Prisma Studio
npm run db:reset         # Migration reset
```

Backend varsayılan olarak şu portu kullanır:

```text
http://localhost:5000
```

Sağlık kontrolü:

```text
GET /health
```

API route grupları:

- `/api/auth`
- `/api/posts`
- `/api/messages`
- `/api/admin`

## Docker ile Çalıştırma

Tüm servisleri production profiline yakın şekilde başlatmak için:

```bash
docker-compose up --build
```

Servisler:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5001`
- PostgreSQL: host üzerinde `localhost:5434`, container içinde `db:5432`

Logları takip etmek için:

```bash
docker-compose logs -f backend
```

Servisleri durdurmak için:

```bash
docker-compose down
```

Docker ile frontend geliştirme servisini kullanmak için:

```bash
docker-compose --profile dev up frontend-dev
```

## Mock ve Gerçek API Modu

Frontend varsayılan olarak mock data ile çalışır:

```env
VITE_USE_MOCK_DATA=true
```

Bu modda platform verisi `frontend/src/data/mockData.ts` içinden gelir ve uygulama state'i context/localStorage üzerinde tutulur.

Gerçek API çağrılarını açmak için `frontend/.env` dosyasında:

```env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:5000/api
```

Docker compose kullanırken backend API portu `5001` olduğu için:

```env
VITE_API_URL=http://localhost:5001/api
```

API istemcisi ve mock mode kontrolü:

```text
frontend/src/api/client.ts
```

## Proje Yapısı

```text
.
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   `-- seed.js
|   |-- src/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- index.js
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- test/
|   |   |-- App.tsx
|   |   `-- main.tsx
|   |-- .env.example
|   `-- package.json
|-- docs/
|-- docker-compose.yml
`-- README.md
```

## Mimari Notlar

### Frontend

Frontend tarafında ana state kaynakları:

- `PlatformDataContext`: kullanıcılar, postlar, mesajlar, toplantılar, bildirimler ve aktivite logları.
- `AuthContext`: aktif kullanıcı ve login/logout davranışı.
- `ChatDockContext`: floating chat dock görünürlüğü ve aktif konuşma.

Routing `frontend/src/App.tsx` içinde React Router ile tanımlıdır. `ProtectedRoute`, authentication, onboarding ve admin yetkisini kontrol eder.

### Backend

Backend CommonJS formatında yazılmış Express uygulamasıdır. Prisma schema şu ana modelleri içerir:

- `User`
- `Post`
- `Message`
- `MeetingRequest`
- `Notification`
- `AuditLog`

## Ortam Değişkenleri

Örnek dosyalar:

```text
frontend/.env.example
backend/.env.example
```

Frontend için temel değişkenler:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=HEALTH AI
VITE_USE_MOCK_DATA=true
```

Backend için temel değişkenler:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://healthai_user:healthai_password@localhost:5432/healthai_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
FRONTEND_URL=http://localhost:8080
```

Docker compose içindeki PostgreSQL servisini host üzerinden kullanıyorsanız `DATABASE_URL` portunu `5434` olarak ayarlayın.

## Test

Frontend testleri:

```bash
cd frontend
npm test
```

Backend testleri:

```bash
cd backend
npm test
```

Backend integration testleri veritabanı bağlantısı gerektirir:

```bash
cd backend
npm run test:integration
```

## Katkı Notları

- Frontend geliştirmede önce mevcut component ve context yapısını kontrol edin.
- Yeni UI akışlarında varsayılan olarak mock data kullanın.
- Ortak state gerekiyorsa mevcut context katmanına uygun ilerleyin.
- Backend entegrasyonunda `frontend/src/api/` altındaki istemci fonksiyonlarını tercih edin.
- Değişiklikleri teslim etmeden önce ilgili tarafta test, lint veya build komutunu çalıştırın.
