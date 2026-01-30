# Quest Forge Module Specification

_Last updated: 2026-01-27_

## 0. Purpose

Quest Forge is the **goal → questline** engine of Questline Architect.

It takes a user's free-text goal and turns it into:

- A **Questline** (title + description + structure).
- A set of **Quests** (steps, effort, type).
- Data that is persisted and fully integrated into:
  - Today view
  - Season Map
  - Weekly Recap
  - Boss / XP mechanics

The goals of this module:

1. Turn vague goals into **deep, concrete plans** (not 3 generic steps).
2. Persist questlines/quests so they **exist in the game world**.
3. Provide a **Quest Library** and **gamified completion** (fights, notes, analysis).

---

## 1. Domain objects (Quest Forge context)

These reference the broader app model but are listed here for clarity.

- **Season**
  - Represents a time-boxed journey (e.g., "Q2 Launch Season").
  - Has: id, title, description, start_date, end_date, boss_type, boss_hp_current, boss_hp_max, xp_current, xp_level.

- **Questline**
  - A thematic arc within a Season (e.g., "Build MVP", "Audience Warmup").
  - Has: id, season_id, title, description, order_index.

- **Quest**
  - A concrete step or sub-step in a questline.
  - Has: id, questline_id, title, description, type ("main" | "side"), effort ("S" | "M" | "L"), status ("todo" | "in_progress" | "done" | "dropped"), order, parentId (optional for nested steps), created_at, completed_at.

- **QuestNote**
  - A user-written note attached to a quest completion (for context and later AI analysis).
  - Has: id, quest_id, text, created_at.

- **DailyLog**
  - Aggregated stats per day for Weekly Recap and streaks.

---

## 2. Quest Forge UX flows

### 2.1 Create questline from goal (AI-assisted)

**User flow:**

1. User opens **Quest Forge** (Start New Quest tab).
2. Selects or confirms the **target Season** (usually the active Season).
3. Types a **goal** in one line (e.g., "Launch my MVP and get 20 users in 4 weeks").
4. Clicks **"Generate questline"**.
5. Sees an **editable questline**:
   - Questline title and description.
   - A list/tree of quests with:
     - title (inline editable)
     - effort (S/M/L)
     - type (main/side)
     - order
6. User edits quests, adds/removes steps.
7. Clicks **"Save questline"**.
8. Questline + quests are **saved to DB** and become visible in:
   - Today view (main quests)
   - Season Map (nodes and roads)
   - Quest Library
   - Future Weekly Recap

---

## 3. AI quest breakdowns — behavior & rules

Problem: AI currently returns ~3 generic steps for any goal.

### 3.1 Complexity heuristic

Implement a function that scores goal complexity, e.g.:

```ts
function scoreGoalComplexity(goal: string): number;
```

- Inputs:
  - goal text string.
- Outputs:
  - complexity_score in the range 0–100.

Heuristic factors (rough, not ML):

- Length of text (short vs medium vs long).
- Count of verbs/nouns (approximate tokenization).
- Presence of "big project" keywords, e.g.:
  - "launch", "MVP", "product", "app", "course", "exam",
    "thesis", "campaign", "funnel", "website", "onboarding", "rebrand".

Mapping:

- `score <= 30` → **FLAT**, 5–8 steps.
- `31–60` → **FLAT**, 8–12 steps.
- `> 60` → **TREE**, 12–20 total steps (6–8 phases, each with 2–3 sub-steps).

### 3.2 Questline JSON schema (for AI + validation)

AI output must match this JSON shape:

```jsonc
{
  "questline": {
    "title": "string",
    "description": "string",
    "structure": "flat" | "tree",
    "complexity_score": 0,
    "quests": [
      {
        "id": "string",
        "parentId": "string | null",
        "order": 1,
        "title": "string",
        "description": "string",
        "type": "main" | "side",
        "effort": "S" | "M" | "L",
        "tags": ["string"]
      }
    ]
  }
}
```

Constraints:

- `quests.length` between 5 and 20 inclusive.
- If `structure = "flat"`:
  - All `parentId` must be `null`.
- If `structure = "tree"`:
  - Some quests are "phases" (type="main", effort in ["M","L"], parentId=null).
  - Other quests can reference a phase's `id` as `parentId`.
- At least **40%** of quests must be `type="main"`.

### 3.3 Title and content rules

- Every `quest.title` must **start with a verb** (Design/Write/Ship/Practice/Publish/Reach out/etc.).
- Every `quest.description` must mention a **concrete artifact or outcome**, such as:
  - "draft landing page", "outline 3 posts", "send 5 DMs", "complete practice test", "deploy build", etc.
- Hard **ban** list (never use these titles verbatim):
  - "Plan the project"
  - "Do research"
  - "Work on it"
  - "Stay consistent"
  - "Finalize everything"

---

## 4. Gemini integration (AI backend)

Primary LLM path: **Gemini 3 Pro (structured outputs)**.

### 4.1 Environment variables

- `GEMINI_API_KEY`
  - Required for AI features.
  - If missing, Quest Forge should show a clear, non-crashing error:
    - "AI is not configured. Set GEMINI_API_KEY to use Quest Forge."

### 4.2 Gemini client responsibilities

Implement a reusable **Gemini client module** responsible for:

- Reading `GEMINI_API_KEY` from the environment.
- Calling the Gemini API with:
  - A model such as Gemini 3 Pro.
  - A configuration that requests structured JSON output:
    - `response_mime_type`: `"application/json"`.
    - A JSON schema equivalent to the Questline schema in section 3.2.
- Returning parsed JSON or throwing a typed error on failure.

Use Gemini's **structured output** capability to bias strongly toward valid JSON.

### 4.3 generateQuestline helper responsibilities

Implement a reusable **generateQuestline** helper function, for example:

```ts
type GenerateQuestlineInput = {
  goal: string;
  seasonTitle?: string;
  seasonGoal?: string;
  timeWindowWeeks?: number;
};

async function generateQuestline(input: GenerateQuestlineInput): Promise<QuestlineJson>;
```

Implementation outline:

1. Compute `complexity_score` using `scoreGoalComplexity(goal)`.
2. Build a **system prompt** that:
   - Explains Questline Architect and the user (solo founder/creator).
   - Emphasizes:
     - Verb-first titles.
     - Concrete artifacts.
     - Ban list.
     - Structure rules based on complexity_score.

3. Build a **user prompt** that includes:
   - Goal text.
   - Season title/goal if available.
   - Time window.
   - Complexity rules restated (5–8 / 8–12 / 12–20 steps).

4. Call the Gemini client with:
   - system prompt, user prompt.
   - the Questline JSON schema.

5. Validate using the local schema (e.g., Zod):
   - If validation fails:
     - Retry once, appending a short error summary to the prompt.
   - If it still fails:
     - Throw a typed error to the caller.

---

## 5. Wiring Quest Forge → DB → other tabs

### 5.1 Saving questlines and quests

On **"Save questline"**:

1. Determine target Season:
   - Use currently active Season.
   - If none: show "Create a Season first" with link to Season creation.

2. Persist:
   - A `Questline` record (title, description, seasonId, order_index).
   - Multiple `Quest` records:
     - `questline_id` = new questline id.
     - `title`, `description`, `type`, `effort`, `order`, `parentId`.
     - `status = "todo"`.

3. After saving:
   - Redirect or update UI to show the new questline in Season Map and Today view.

### 5.2 Today view integration

Today view should:

- Query all `Quest` records for the active Season with `status IN ("todo", "in_progress")`.
- Prioritize `type = "main"` as the top row(s).
- Optionally display a subset (e.g., next 3 main quests).

When Quest Forge saves a questline:

- Newly created "main" quests should automatically appear in Today via the shared query logic.

### 5.3 Season Map integration

Season Map uses `Quest` data to:

- Place POIs (quest markers) at coordinates derived from `questline_id` and `order`.
- Draw roads connecting quests in order within each questline.

Any quest created via Quest Forge:

- Must appear as nodes and roads on the map once the relevant chunks are discovered.

### 5.4 Weekly Recap integration (later)

Weekly Recap reads from:

- Completed `Quest` records and optionally `QuestNote` text.
- It uses this to generate:
  - Narrative recap.
  - Stats (how many main vs side quests).
  - Patterns for next-week suggestions.

For now (v1), ensure completed quests are correctly timestamped and logged in `DailyLog`.

---

## 6. Quest Library + completion mechanics

### 6.1 Quest Library

Add a **Quest Library** view:

- Lists all current quests grouped by:
  - Season
  - Questline
- Filters:
  - Status (todo, in_progress, done).
  - Type (main/side).

From Quest Library:

- Clicking a quest opens a **Quest Detail** panel with:
  - Quest title, description, effort, type.
  - Sub-steps (if tree structure).
  - "Start fight / Complete step" action.
  - Note field for user commentary.

### 6.2 Completing a quest step (fight mechanic)

When a user marks a quest step as **done**:

1. Show a **gamified animation sequence**, e.g.:
   - Highlight the quest row.
   - XP pop-up ("+10 XP", "+20 XP").
   - Boss HP bar visibly decreases.
   - (Optional) small confetti burst.

2. Update state:
   - `Quest.status = "done"`, `completed_at = now`.
   - Update Season XP and Boss HP according to game rules.
   - Append a `QuestNote` if user wrote one.

3. Log the completion in `DailyLog` for Weekly Recap.

### 6.3 Note field for AI reflection

Each quest step completion should allow a **short note**:

- Examples:
  - "This took longer than expected, got stuck on API."
  - "Was easier than I thought; copy came quickly."
- Stored in `QuestNote`.
- Later used in Weekly Recap:
  - AI can summarize recurring themes, bottlenecks, and emotional signals from notes.

---

## 7. Non-goals (for this module)

To avoid scope creep, Quest Forge v1 will **not** include:

- Team collaboration or shared questlines.
- Rich text notes (plain text only).
- Complex loot/shop mechanics (basic XP + boss damage is enough).
- Cross-season quest linking.

---

## 8. Implementation guidance for AI tools

When using AI coding tools:

- Always reference this file as the behavioral source of truth:
  - "Follow QUEST_FORGE_SPEC.md for Quest Forge behavior and data shape."
- For AI-related code:
  - Use Gemini structured outputs + JSON schema as the primary path.
  - Use a local schema validator and a single retry on failure.
- For wiring:
  - Keep one central `generateQuestline` helper as the **only** entry point for Quest Forge AI.
  - Keep Quest Forge responsible only for:
    - Turning goals → questlines/quests.
    - Saving them.
    - Making them available to Today, Season Map, Quest Library, and Recap.

This file is the **single source of truth** for how Quest Forge should work.
