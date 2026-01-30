import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../db/schema";
import path from "path";

// Function to handle database connection safely
// In Next.js dev mode, this prevents multiple connections hot-reloading
const dbPath = path.resolve(process.cwd(), "sqlite.db");

// Using a global variable to maintain the connection in dev
const globalForDb = global as unknown as {
    sqlite: Database.Database | undefined
};

let sqlite: Database.Database;

if (globalForDb.sqlite) {
    sqlite = globalForDb.sqlite;
} else {
    sqlite = new Database(dbPath);
    if (process.env.NODE_ENV !== "production") {
        globalForDb.sqlite = sqlite;
    }
}

export const db = drizzle(sqlite, { schema });
