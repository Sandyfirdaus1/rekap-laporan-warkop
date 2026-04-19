# Rekap Warkop

Aplikasi rekapitulasi warkop yang dibangun dengan Next.js, MongoDB, dan TypeScript.

## Getting Started

### Prerequisites

- Node.js (v20 atau lebih baru)
- MongoDB Atlas account (untuk database)
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
- `MONGODB_URI`: MongoDB connection string dari MongoDB Atlas
- `MONGODB_DB`: Nama database (default: warkop)
- `JWT_SECRET`: Secret key untuk JWT authentication (generate string yang kuat)

5. Run development server:
```bash
npm run dev
```

6. Buka [http://localhost:3000](http://localhost:3000) di browser.

## Environment Variables

Lihat file `.env.example` untuk referensi environment variables yang dibutuhkan.

## Deploy on Vercel

### Langkah 1: Persiapan Database

1. Login ke [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Buat cluster baru atau gunakan yang sudah ada
3. Buat database user dengan password
4. Whitelist IP address (pilih "Allow Access from Anywhere" untuk Vercel)
5. Copy connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

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
   - `MONGODB_URI`: MongoDB connection string dari Atlas
   - `MONGODB_DB`: warkop (atau nama database yang diinginkan)
   - `JWT_SECRET`: Generate string yang kuat (gunakan: `openssl rand -base64 32`)

### Langkah 4: Deploy

1. Klik "Deploy" di Vercel
2. Tunggu proses build selesai
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

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Deployment Documentation](https://vercel.com/docs)
