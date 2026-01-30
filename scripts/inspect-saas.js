const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

function inspect() {
    const ql = db.prepare("SELECT * FROM questlines WHERE title LIKE ? ORDER BY id DESC LIMIT 1").get("%SaaS%");
    if (!ql) {
        console.log("No SaaS questline found.");
        return;
    }

    console.log("=== QUESTLINE ===");
    console.log(`Title: ${ql.title}`);
    console.log(`ID: ${ql.id}`);

    const tasks = db.prepare("SELECT title, id, parent_id, status FROM quests WHERE questline_id = ?").all(ql.id);
    console.log(`\n=== TASKS (${tasks.length}) ===`);

    // Create a map for easy lookup
    const taskMap = new Map();
    tasks.forEach(t => taskMap.set(t.id, t));

    // Print with visual hierarchy
    tasks.forEach(t => {
        if (!t.parent_id) {
            console.log(`[MAIN] ${t.title} (${t.id})`);
            tasks.filter(c => c.parent_id === t.id).forEach(c => {
                console.log(`  └── [SUB] ${c.title} (${c.id})`);
            });
        }
    });

    // Check for any tasks that found no parent (should not happen in a strict tree but good for debugging)
    const orphans = tasks.filter(t => t.parent_id && !taskMap.has(t.parent_id));
    if (orphans.length > 0) {
        console.log("\n=== PARENT-LESS CHILDREN (ERRORS) ===");
        console.table(orphans);
    }
}

inspect();
