import { users, seasons, questlines, quests, dailyLogs } from "../src/db/schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
const Database = require("better-sqlite3");

const dbPath = path.join(process.cwd(), "sqlite.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function main() {
    console.log("🌱 Seeding database...");

    // 1. Create User
    const userId = "83bde9ea-340d-438e-a118-7123d9dbf694"; // Fixed ID for consistency
    const passwordHash = await bcrypt.hash("QuestHero_2024!", 10);

    await db.insert(users).values({
        id: userId,
        email: "hero@quest.com",
        displayName: "Quest Hero",
        passwordHash: passwordHash,
        class: "Architect",
    }).onConflictDoNothing();
    console.log("Created User:", userId);

    // 2. Create Season
    const seasonId = uuidv4();
    await db.insert(seasons).values({
        id: seasonId,
        userId: userId,
        title: "Season of Foundations",
        description: "Launch the MVP of Questline Architect",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
        status: "active",
        bossType: "Chaos",
        bossHpMax: 100,
        bossHpCurrent: 100,
        xpCurrent: 0,
        xpLevel: 1,
    });
    console.log("Created Season:", seasonId);

    // 3. Create Questline
    const questlineId = uuidv4();
    await db.insert(questlines).values({
        id: questlineId,
        seasonId: seasonId,
        title: "Core Infrastructure",
        description: "Setting up the tech stack",
        orderIndex: 0,
    });

    // 4. Create Quests
    await db.insert(quests).values([
        {
            id: uuidv4(),
            questlineId: questlineId,
            seasonId: seasonId,
            title: "Initialize Project",
            type: "main",
            effort: "S",
            status: "done",
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
        },
        {
            id: uuidv4(),
            questlineId: questlineId,
            seasonId: seasonId,
            title: "Setup Database",
            type: "main",
            effort: "M",
            status: "in_progress",
        },
        {
            id: uuidv4(),
            questlineId: questlineId,
            seasonId: seasonId,
            title: "Design System",
            type: "side",
            effort: "S",
            status: "todo",
        },
    ]);

    // 5. Create Daily Log
    await db.insert(dailyLogs).values({
        id: uuidv4(),
        userId: userId,
        date: new Date().toISOString().split('T')[0],
        mainQuestsCompletedCount: 1,
        sideQuestsCompletedCount: 0,
    });

    console.log("✅ Seeding complete.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
