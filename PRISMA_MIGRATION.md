# Prisma Migration Guide

Project ini menggunakan TiDB Cloud (MySQL-compatible) dengan Prisma ORM. File ini menjelaskan cara migrate dari mysql2 ke Prisma.

## Current State

Project saat ini menggunakan:
- `mysql2` library untuk koneksi database langsung
- File `src/lib/mysql.ts` untuk database connection pool
- Raw SQL queries di API routes

## Target State

Project akan menggunakan:
- Prisma ORM untuk database operations
- File `src/lib/prisma.ts` untuk Prisma client
- Type-safe database queries dengan Prisma Client

## Migration Steps

### 1. Setup Prisma (Sudah Dilakukan)

✅ Prisma sudah diinstall
✅ Schema sudah didefinisikan di `prisma/schema.prisma`
✅ Prisma client sudah dibuat di `src/lib/prisma.ts`

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migration

```bash
npx prisma migrate dev --name init
```

### 4. Update API Routes untuk Menggunakan Prisma

Contoh migration untuk `src/app/api/products/route.ts`:

**Before (mysql2):**
```typescript
import pool from "@/lib/mysql";

const [rows] = await pool.query("SELECT * FROM products");
```

**After (Prisma):**
```typescript
import { prisma } from "@/lib/prisma";

const products = await prisma.product.findMany();
```

### 5. Files yang Perlu Diupdate

Berikut adalah API routes yang perlu diupdate:

- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/stock-out/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/confirm-payment/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/dashboard/route.ts`

### 6. Remove mysql2 Dependency

Setelah semua API routes sudah diupdate:

```bash
npm uninstall mysql2
rm src/lib/mysql.ts
```

## Benefits of Prisma

- **Type-safe**: Auto-generated types berdasarkan schema
- **Better DX**: Auto-completion dan type checking
- **Query Building**: Tidak perlu menulis raw SQL
- **Migrations**: Database version control
- **Studio**: GUI untuk melihat dan edit database data

## Rollback Plan

Jika ada masalah dengan Prisma migration:

1. Kembalikan API routes ke menggunakan mysql2
2. Install kembali mysql2: `npm install mysql2`
3. Delete Prisma files jika perlu

## Development Workflow

### Saat Mengubah Schema

1. Update `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name description`
3. Prisma otomatis generate ulang client

### Production Deployment

1. Environment variable `DATABASE_URL` harus di-set di Vercel
2. `postinstall` script akan otomatis generate Prisma client
3. Migration otomatis dijalankan jika menggunakan `prisma migrate deploy`
