const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

function audit() {
    console.log("=== QUEST HIERARCHY AUDIT ===");

    // Find quests that have a parent BUT no questline_id
    const orphanedSubtasks = db.prepare(`
        SELECT 
            q.title as subtask_title, 
            q.parent_id, 
            pq.title as parent_title, 
            pq.questline_id as parent_ql_id,
            ql.title as parent_ql_title
        FROM quests q
        JOIN quests pq ON q.parent_id = pq.id
        LEFT JOIN questlines ql ON pq.questline_id = ql.id
        WHERE q.questline_id IS NULL
    `).all();

    console.log(`Found ${orphanedSubtasks.length} subtasks with NULL questline_id but VALID parent_id.`);
    console.table(orphanedSubtasks);

    // Find quests that should probably be in a folder but aren't
    const suspiciousStandalone = db.prepare(`
        SELECT title, parent_id, questline_id, created_at
        FROM quests
        WHERE questline_id IS NULL AND (title LIKE '%Meta%' OR title LIKE '%CEO%')
    `).all();

    console.log("\n=== SUSPICIOUS STANDALONE (META/CEO) ===");
    console.table(suspiciousStandalone);
}

audit();
