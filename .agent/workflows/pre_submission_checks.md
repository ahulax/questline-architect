---
description: Ensure application stability before submitting results
---

Before submitting any major changes to the user, follow these steps to verify the application's health:

1. **Verify Server Status**
   - Ensure the development server is running (usually `npm run dev`).
   - If not, start it.

1. **Automated Verification (Run this first!)**
   - Run the command: `npm run verify`
   - This script runs type checks and a full build to catch server-side errors (like `ssr: false`).
   - If this fails, **do not proceed**. Fix the build errors first.

2. **Manual Navigation Check**
   - After the build passes, ensure the dev server is running (`npm run dev`).

3. **Agentic Visual Verification (MANDATORY)**
   - **Do not assume code works just because it compiles.**
   - You MUST use the `browser_subagent` tool to "act as the user".
   - **Test the specifics:** If you added a button, click it. If you changed a font, take a screenshot to compare.
   - **Constraint:** You cannot submit a task until you have visually confirmed the *feature* is present and working, not just that the page loads.
   - Open `http://localhost:3000`.
   - **Critical:** Click side menu options (Map, Recap, Today) to ensure navigation works.

3. **Remediation**
   - If any errors are found, STOP.
   - Debug and fix the server-side or build issues immediately.
   - Repeat verification until the app is stable.
