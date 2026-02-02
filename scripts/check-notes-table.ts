import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function checkSchema() {
    try {
        const result = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'quest_notes';
        `);
        console.log("Found table:", result);

        // Also check if we can select from it
        if (result.length > 0) {
            const count = await db.execute(sql`SELECT count(*) FROM quest_notes`);
            console.log("Row count:", count);
        } else {
            console.log("Table quest_notes NOT FOUND");
        }
    } catch (e) {
        console.error("Schema check failed:", e);
    }
}

checkSchema();
