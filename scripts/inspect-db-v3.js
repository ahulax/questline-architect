const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

async function inspect() {
    const qlines = db.prepare("SELECT id, title FROM questlines").all();

    console.log("=== Grouped Quests by Questline ===");
    for (const ql of qlines) {
        const qs = db.prepare("SELECT title, status FROM quests WHERE questline_id = ?").all(ql.id);
        console.log(`\nFolder: [${ql.title}] (${qs.length} quests)`);
        qs.forEach(q => console.log(`  - [${q.status}] ${q.title}`));
    }

    console.log("\n=== Standalone Quests Timeline ===");
    const standalones = db.prepare(`
        SELECT id, title, status, created_at 
        FROM quests 
        WHERE questline_id IS NULL 
        ORDER BY created_at DESC
    `).all();

    standalones.forEach(q => {
        console.log(`[${q.created_at || 'N/A'}] [${q.status}] ${q.title}`);
    });
}

inspect();
