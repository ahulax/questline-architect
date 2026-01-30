const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

function audit() {
    console.log("=== TPM RELATED QUESTS (FOLDER & STANDALONE) ===");
    const quests = db.prepare(`
        SELECT 
            q.title, 
            q.questline_id, 
            ql.title as ql_title,
            q.created_at
        FROM quests q
        LEFT JOIN questlines ql ON q.questline_id = ql.id
        WHERE q.title LIKE '%TPM%'
    `).all();
    console.table(quests);

    console.log("\n=== STANDALONE QUESTS BY DAY ===");
    const standalone = db.prepare(`
        SELECT SUBSTR(created_at, 1, 10) as day, COUNT(*) as count 
        FROM quests 
        WHERE questline_id IS NULL 
        GROUP BY day
    `).all();
    console.table(standalone);
}

audit();
