# Rekap Warkop

Aplikasi rekapitulasi warkop yang dibangun dengan Next.js, TiDB Cloud (MySQL-compatible), Prisma ORM, dan TypeScript.

## Getting Started

### Prerequisites

- Node.js (v20 atau lebih baru)
- TiDB Cloud account (untuk database)
- npm, yarn, pnpm, atau bun

### Installation

1. Clone repository:
```bash
git clone <your-repo-url>
cd rekap-warkop
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` dan isi dengan:
- `DATABASE_URL`: TiDB Cloud connection string (format: `mysql://username:password@host:4000/database`)
- `JWT_SECRET`: Secret key untuk JWT authentication (generate string yang kuat)

5. Setup database dengan Prisma:
```bash
npx prisma migrate dev
```

6. Run development server:
```bash
npm run dev
```

7. Buka [http://localhost:3000](http://localhost:3000) di browser.

## Environment Variables

Lihat file `.env.example` untuk referensi environment variables yang dibutuhkan.

## Database Setup dengan TiDB Cloud

### 1. Buat TiDB Cloud Cluster

1. Login ke [TiDB Cloud](https://tidbcloud.com/)
2. Buat cluster baru (Serverless tier tersedia gratis)
3. Tunggu cluster siap digunakan
4. Buat database user dengan password
5. Copy connection string dari dashboard

### 2. Format Connection String

TiDB Cloud menggunakan format MySQL connection string:
```
mysql://username:password@host:4000/database
```

Contoh:
```
mysql://root:password@xxx.tidbcloud.com:4000/warkop
```

## Deploy on Vercel

### Langkah 1: Persiapan Database

1. Login ke [TiDB Cloud](https://tidbcloud.com/)
2. Buat cluster atau gunakan yang sudah ada
3. Pastikan cluster dalam status "Active"
4. Copy connection string dari dashboard TiDB Cloud

### Langkah 2: Setup di Vercel

1. Push code ke GitHub/GitLab/Bitbucket
2. Login ke [Vercel](https://vercel.com)
3. Klik "Add New Project"
4. Import repository dari GitHub/GitLab/Bitbucket
5. Vercel akan otomatis mendeteksi Next.js project

### Langkah 3: Setup Environment Variables di Vercel

Di dashboard Vercel project:
1. Klik "Settings" → "Environment Variables"
2. Tambahkan environment variables:
   - `DATABASE_URL`: TiDB Cloud connection string
   - `JWT_SECRET`: Generate string yang kuat (gunakan: `openssl rand -base64 32`)
   - `NODE_ENV`: `production`

### Langkah 4: Deploy

1. Klik "Deploy" di Vercel
2. Tunggu proses build selesai (termasuk Prisma generate)
3. Aplikasi akan live dengan URL dari Vercel

### Deploy Menggunakan Vercel CLI

Alternatif deploy menggunakan CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel
```

## Development dengan Prisma

### Generate Prisma Client
```bash
npx prisma generate
```

### Migrate Database
```bash
# Development migration
npx prisma migrate dev --name migration_name

# Production migration
npx prisma migrate deploy
```

### View Database di Prisma Studio
```bash
npx prisma studio
```

### Reset Database (Hati-hati: Menghapus semua data)
```bash
npx prisma migrate reset
```

## Project Structure

- `src/app/api/` - API routes untuk products, sales, orders, auth
- `src/lib/prisma.ts` - Prisma client configuration
- `src/lib/types.ts` - TypeScript type definitions
- `prisma/schema.prisma` - Database schema dengan Prisma
- `prisma/migrations/` - Database migration files

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TiDB Cloud Documentation](https://docs.pingcap.com/tidbcloud/)
- [Vercel Deployment Documentation](https://vercel.com/docs)
