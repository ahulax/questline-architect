require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { sql } = require('drizzle-orm');

async function check() {
    console.log("Checking connection to:", process.env.DATABASE_URL?.split('@')[1] || "No URL found");

    if (!process.env.DATABASE_URL) {
        console.error("❌ No DATABASE_URL found");
        process.exit(1);
    }

    try {
        const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
        const result = await sql`SELECT 1 as connected`;
        console.log("✅ Database Connected Successfully!");
        console.log("Ping Result:", result);

        await sql.end();
        process.exit(0);
    } catch (e) {
        console.error("❌ Connection Failed:", e);
        process.exit(1);
    }
}

check();
