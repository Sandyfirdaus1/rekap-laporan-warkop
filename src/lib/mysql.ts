import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL tidak di-set. Tambahkan ke .env.local");
}

// Parse DATABASE_URL
const url = new URL(process.env.DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = mysql.createPool(config);

export default pool;

export function getDbName() {
  return process.env.DATABASE_NAME ?? config.database;
}
