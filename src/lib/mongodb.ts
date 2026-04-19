import { MongoClient, type MongoClientOptions } from "mongodb";
import dns from "node:dns";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI tidak di-set. Tambahkan ke .env.local");
}

const uri = process.env.MONGODB_URI;

/**
 * querySrv ECONNREFUSED di Windows sering karena resolver DNS memblokir SRV.
 * Set MONGODB_USE_PUBLIC_DNS=1 di .env.local untuk pakai 8.8.8.8 (hanya proses Node ini).
 */
if (process.env.MONGODB_USE_PUBLIC_DNS === "1") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 20_000,
  connectTimeoutMS: 20_000,
  /** Membantu beberapa setup Windows / dual-stack IPv4-IPv6 */
  family: 4,
};

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(uri, options);
  return client.connect().catch((err) => {
    if (process.env.NODE_ENV === "development") {
      globalForMongo._mongoClientPromise = undefined;
    }
    throw err;
  });
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = createClientPromise();
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

export default clientPromise;

export function getDbName() {
  return process.env.MONGODB_DB ?? "warkop";
}
