import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

/*
 * Database Connection (Postgres)
 */

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
    // In build time or CI, this might fail if we don't have env vars set up, 
    // but for runtime we need it.
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PHASE) {
        console.warn("⚠️ DATABASE_URL is not defined.");
    }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString || "postgres://postgres:postgres@localhost:5432/questline", { prepare: false });

export const db = drizzle(client, { schema });
