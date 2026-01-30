
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function verify() {
    console.log("🔍 Starting Pre-submission Verification...");

    try {
        // 1. Type Check
        console.log("TypeScript Check...");
        await execAsync("npx tsc --noEmit");
        console.log("✅ TypeScript Passed");

        // 2. Build Check (catches Next.js specific errors)
        console.log("Build Check (this may take a minute)...");
        await execAsync("npm run build");
        console.log("✅ Build Passed");

        console.log("🎉 All checks passed! App is stable.");
    } catch (error) {
        console.error("❌ Verification Failed!");
        console.error(error.stdout || error.message);
        process.exit(1);
    }
}

verify();
