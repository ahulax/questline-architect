
import { generateQuestline } from "../src/lib/forge-actions";

// Mock environment for test script if needed, or rely on existing logic
// Note: We need to ensure we can run this script with ts-node or similar.
// Since this project uses Next.js/Turbopack, running standalone scripts can be tricky with imports.
// We will make a simple self-contained test runner or use a workaround.
// Ideally, we'd use Jest, but for "manual test script":

async function runTests() {
    console.log("🧪 Starting Manual Questline Tests...\n");

    const testCases = [
        {
            input: "Send an email to 5 users asking for feedback",
            expect: {
                structure: "flat",
                minQuests: 5,
                maxQuests: 8,
                complexityMax: 30
            }
        },
        {
            input: "Launch my MVP in 4 weeks and get first 20 users",
            expect: {
                structure: "flat", // Or tree, boundary case
                minQuests: 8,
                maxQuests: 20,
                complexityMin: 31
            }
        },
        {
            input: "Prepare for my final psychology exam: 12 chapters, 3 weeks",
            expect: {
                structure: "tree",
                minQuests: 12,
                maxQuests: 20,
                complexityMin: 60
            }
        }
    ];

    for (const test of testCases) {
        console.log(`\n📋 Testing: "${test.input}"`);
        try {
            const res = await generateQuestline(test.input);

            if (!res || !res.success || !res.data) {
                console.error("❌ FAILED: No result returned.");
                continue;
            }

            const { complexity_score, structure, quests } = res.data.questline;
            console.log(`   -> Score: ${complexity_score} | Structure: ${structure} | Count: ${quests.length}`);

            let passed = true;

            // 1. Structure Check
            if (test.expect.structure && structure !== test.expect.structure) {
                // Allow "flat" for MVP case if complexity was mid-range
                if (test.input.includes("MVP") && structure === "tree") {
                    // acceptable
                } else {
                    console.error(`   ❌ Structure Mismatch: Expected ${test.expect.structure}, got ${structure}`);
                    passed = false;
                }
            }

            // 2. Count Check
            if (quests.length < test.expect.minQuests || quests.length > test.expect.maxQuests) {
                console.error(`   ❌ Quest Count ${quests.length} out of range [${test.expect.minQuests}, ${test.expect.maxQuests}]`);
                passed = false;
            }

            // 3. Complexity Check
            if (test.expect.complexityMax && complexity_score > test.expect.complexityMax) {
                console.error(`   ❌ Complexity ${complexity_score} too high (Expected <= ${test.expect.complexityMax})`);
                passed = false;
            }
            if (test.expect.complexityMin && complexity_score < test.expect.complexityMin) {
                console.error(`   ❌ Complexity ${complexity_score} too low (Expected >= ${test.expect.complexityMin})`);
                passed = false;
            }

            // 4. Main Type Ratio (>= 40%)
            const mainCount = quests.filter(q => q.type === "main").length;
            const ratio = mainCount / quests.length;
            if (ratio < 0.4) {
                console.error(`   ❌ Main Quest Ratio ${ratio.toFixed(2)} too low (< 0.4)`);
                passed = false;
            }

            // 5. Banned Titles
            const banned = ["Plan the project", "Do research", "Work on it", "Stay consistent", "Finalize everything"];
            const hasBanned = quests.some(q => banned.some(b => q.title.toLowerCase().includes(b.toLowerCase())));
            if (hasBanned) {
                console.error(`   ❌ Found Banned Titles!`);
                passed = false;
            }

            if (passed) {
                console.log("   ✅ PASS");
            }

        } catch (e) {
            console.error("   ❌ ERROR:", e);
        }
    }
}

// We can't easily execute this because of Next.js imports (alias @lib etc) in a standalone node script.
// To make it work, we'd need ts-node with path mapping or run it via a specific Next.js script runner.
// FOR NOW: We will assume we can run it if we fix imports, OR we can convert this to a simple .js script removing imports and mocking dependency just for the logic test. 
// BUT, the user asked for a MANUAL TEST SCRIPT. 
// I will output this file, but acknowledge running it requires environment setup.
// BETTER: I will create a temporary "Test Page" or a route handler that runs this? 
// OR simpler: make a standalone verify script that imports the logic if possible.
// Given the complexity of TS paths in Next.js for standalone scripts, I will place this in `scripts/test-forge.ts` and try to run it with `npx tsx` which supports tsconfig paths usually.

runTests();
