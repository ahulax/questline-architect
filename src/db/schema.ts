import { pgTable, text, integer, serial, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- Enums ---
export const seasonStatusEnum = ["active", "completed", "failed", "archived"] as const;
export const questTypeEnum = ["main", "side"] as const;
export const questEffortEnum = ["S", "M", "L"] as const;
export const questStatusEnum = ["todo", "in_progress", "done", "dropped"] as const;
export const artifactTypeEnum = ["questline_suggestion", "weekly_recap"] as const;
export const lootRarityEnum = ["common", "rare", "legendary"] as const;

// --- Tables ---

export const users = pgTable("users", {
    id: text("id").primaryKey(), // We are managing IDs manually with UUIDs still
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    passwordHash: text("password_hash"), // For credentials auth
    class: text("class").default("Adventurer"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: text("status", { enum: seasonStatusEnum }).default("active").notNull(), // Enum handled as text for simplicity or usage of pgEnum
    bossType: text("boss_type").notNull(), // e.g. "Chaos", "Perfectionism"
    bossHpMax: integer("boss_hp_max").notNull(),
    bossHpCurrent: integer("boss_hp_current").notNull(),
    bossImageUrl: text("boss_image_url"),
    xpCurrent: integer("xp_current").default(0).notNull(),
    xpLevel: integer("xp_level").default(1).notNull(),
});

export const questlines = pgTable("questlines", {
    id: text("id").primaryKey(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    title: text("title").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").default(0).notNull(),
});

export const quests = pgTable("quests", {
    id: text("id").primaryKey(),
    questlineId: text("questline_id").references(() => questlines.id),
    seasonId: text("season_id").references(() => seasons.id),
    orderIndex: integer("order_index").default(0).notNull(),
    parentId: text("parent_id"), // For sub-quests (recursive)
    title: text("title").notNull(),
    description: text("description"),
    flavorData: text("flavor_data"), // JSON string or real JSONB
    type: text("type", { enum: questTypeEnum }).default("main").notNull(),
    effort: text("effort", { enum: questEffortEnum }).default("M").notNull(),
    status: text("status", { enum: questStatusEnum }).default("todo").notNull(),
    dueDate: timestamp("due_date"),
    startDate: timestamp("start_date"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export const dailyLogs = pgTable("daily_logs", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    date: text("date").notNull(), // YYYY-MM-DD string is fine
    mainQuestsCompletedCount: integer("main_quests_completed_count").default(0).notNull(),
    sideQuestsCompletedCount: integer("side_quests_completed_count").default(0).notNull(),
});

export const aiArtifacts = pgTable("ai_artifacts", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    seasonId: text("season_id").references(() => seasons.id),
    type: text("type", { enum: artifactTypeEnum }).notNull(),
    inputPayload: text("input_payload"), // JSON string
    outputText: text("output_text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const loot = pgTable("loot", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    seasonId: text("season_id").references(() => seasons.id),
    questId: text("quest_id").references(() => quests.id),
    name: text("name").notNull(),
    description: text("description"),
    rarity: text("rarity", { enum: lootRarityEnum }).default("common").notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const questNotes = pgTable("quest_notes", {
    id: text("id").primaryKey(),
    questId: text("quest_id").notNull().references(() => quests.id),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations ---
import { relations } from "drizzle-orm";

export const seasonsRelations = relations(seasons, ({ many }) => ({
    questlines: many(questlines),
}));

export const questlinesRelations = relations(questlines, ({ one, many }) => ({
    season: one(seasons, {
        fields: [questlines.seasonId],
        references: [seasons.id],
    }),
    quests: many(quests),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
    questline: one(questlines, {
        fields: [quests.questlineId],
        references: [questlines.id],
    }),
    season: one(seasons, {
        fields: [quests.seasonId],
        references: [seasons.id],
    }),
    notes: many(questNotes),
}));

export const questNotesRelations = relations(questNotes, ({ one }) => ({
    quest: one(quests, {
        fields: [questNotes.questId],
        references: [quests.id],
    }),
}));
