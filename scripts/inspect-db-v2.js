const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

async function inspect() {
    console.log("--- Questlines Stats ---");
    const qlines = db.prepare(`
        SELECT ql.id, ql.title, ql.season_id, COUNT(q.id) as quest_count
        FROM questlines ql
        LEFT JOIN quests q ON q.questline_id = ql.id
        GROUP BY ql.id
    `).all();
    console.table(qlines);

    console.log("\n--- Standalone Quests (NULL questline_id) ---");
    const standaloneCount = db.prepare("SELECT COUNT(*) as count FROM quests WHERE questline_id IS NULL").get();
    console.log("Total: " + standaloneCount.count);

    const standaloneSamples = db.prepare("SELECT id, title, status, season_id FROM quests WHERE questline_id IS NULL LIMIT 20").all();
    console.table(standaloneSamples);

    console.log("\n--- Quests with Questline ID vs Questline Table ---");
    const orphans = db.prepare(`
        SELECT q.id, q.title, q.questline_id, q.status
        FROM quests q
        WHERE q.questline_id IS NOT NULL 
        AND q.questline_id NOT IN (SELECT id FROM questlines)
    `).all();
    console.log("Orphaned Quests (invalid questline_id): " + orphans.length);
    console.table(orphans);

    console.log("\n--- Quest Status Distribution ---");
    const statusCounts = db.prepare("SELECT status, COUNT(*) as count FROM quests GROUP BY status").all();
    console.table(statusCounts);
}

inspect();
