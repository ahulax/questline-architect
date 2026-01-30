const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

async function inspect() {
    console.log("=== NEW QUESTLINES (Created Today) ===");
    const qlines = db.prepare("SELECT id, title, (SELECT created_at FROM quests WHERE questline_id = qlines.id LIMIT 1) as created_at FROM questlines ORDER BY created_at DESC").all();
    console.table(qlines);

    console.log("\n=== STANDALONE QUESTS BY TIME ===");
    const standalones = db.prepare(`
        SELECT id, title, created_at 
        FROM quests 
        WHERE questline_id IS NULL 
        ORDER BY created_at DESC
    `).all();
    console.table(standalones);
}

inspect();
