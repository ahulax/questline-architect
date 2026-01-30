const { drizzle } = require("drizzle-orm/better-sqlite3");
const Database = require("better-sqlite3");
const fs = require("fs");

// Minimal schema for inspection
const sqlite = new Database("sqlite.db");
const db = sqlite;

async function inspect() {
    console.log("--- Questlines ---");
    const qlines = db.prepare("SELECT id, title, season_id FROM questlines").all();
    console.table(qlines);

    console.log("\n--- Quests ---");
    const qs = db.prepare("SELECT id, title, questline_id, season_id, status FROM quests LIMIT 20").all();
    console.table(qs);

    console.log("\n--- Quests with NULL questline_id ---");
    const nullQs = db.prepare("SELECT id, title, season_id, status FROM quests WHERE questline_id IS NULL").all();
    console.table(nullQs);
}

inspect();
