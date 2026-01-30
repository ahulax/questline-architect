const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

async function run() {
    console.log("=== DB DUMP (Last 50 Quests) ===");
    const qs = db.prepare(`
        SELECT 
            q.title, 
            q.questline_id, 
            ql.title as ql_title,
            q.created_at,
            q.status
        FROM quests q
        LEFT JOIN questlines ql ON q.questline_id = ql.id
        ORDER BY q.created_at DESC
        LIMIT 50
    `).all();
    console.table(qs);

    console.log("\n=== UNEXPECTED STANDALONE (Today) ===");
    const today = new Date().toISOString().split('T')[0];
    const orphans = db.prepare(`
        SELECT title, questline_id, created_at
        FROM quests
        WHERE questline_id IS NULL AND (created_at LIKE ? OR created_at IS NULL)
    `).all(today + '%');
    console.table(orphans);
}

run();
