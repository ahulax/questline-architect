const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

function inspect() {
    const ql = db.prepare("SELECT * FROM questlines WHERE title LIKE ? ORDER BY id DESC LIMIT 1").get("%Keyboard%");
    if (!ql) {
        console.log("No keyboard questline found.");
        return;
    }

    console.log("=== QUESTLINE ===");
    console.log(`Title: ${ql.title}`);
    console.log(`ID: ${ql.id}`);

    const tasks = db.prepare("SELECT title, questline_id, parent_id, status FROM quests WHERE questline_id = ?").all(ql.id);
    console.log(`\n=== TASKS (${tasks.length}) ===`);
    console.table(tasks);

    const standalone = db.prepare("SELECT title, questline_id, parent_id FROM quests WHERE questline_id IS NULL AND (title LIKE ? OR title LIKE ?)").all("%Keyboard%", "%mechanical%");
    if (standalone.length > 0) {
        console.log("\n=== STANDALONE KEYBOARD TASKS ===");
        console.table(standalone);
    } else {
        console.log("\nNo standalone keyboard tasks found.");
    }
}

inspect();
