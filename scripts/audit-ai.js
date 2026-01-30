const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

async function audit() {
    console.log("=== Auditing AI Artifacts vs Quests ===");

    // Find the latest Senior TPM artifact
    const artifact = db.prepare(`
        SELECT output_text, created_at 
        FROM ai_artifacts 
        WHERE output_text LIKE '%Senior TPM%' 
        ORDER BY created_at DESC 
        LIMIT 1
    `).get();

    if (!artifact) {
        console.log("No AI artifact found for Senior TPM.");
        return;
    }

    console.log(`Latest Artifact Found: ${artifact.created_at}`);
    const data = JSON.parse(artifact.output_text);
    const generatedQuests = data.questline.quests;

    console.log(`AI Generated: ${generatedQuests.length} quests.`);
    generatedQuests.forEach(q => console.log(`  - [AI] ${q.title}`));

    // Find the matching Questline in DB
    const ql = db.prepare("SELECT id, title FROM questlines WHERE title = ?").get(data.questline.title);

    if (ql) {
        const dbQuests = db.prepare("SELECT title FROM quests WHERE questline_id = ?").all(ql.id);
        console.log(`\nDB Folder [${ql.title}] has ${dbQuests.length} quests.`);
        dbQuests.forEach(q => console.log(`  - [DB] ${q.title}`));

        if (dbQuests.length < generatedQuests.length) {
            console.log("\n!!! WARNING: DB folder is MISSING quests that AI generated.");
            const missing = generatedQuests.filter(aq => !dbQuests.find(dq => dq.title === aq.title));
            console.log("Missing Titles:");
            missing.forEach(m => console.log(`  - ${m.title}`));
        }
    } else {
        console.log("\n!!! ERROR: Questline not found in DB by title.");
    }
}

audit();
