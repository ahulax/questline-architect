---
name: verify_changes
description: Mandates a strict 3-step verification protocol (Automated Build, Server Health, Visual Check) before submitting any changes.
---

# Verify Changes Skill

**Goal**: Ensure no broken code is ever submitted to the user by enforcing strict self-correction and visual validation.

**When to use**: You MUST use this skill at the end of **every** task, before sending a final `notify_user` or `walkthrough`.

## The Protocol

### Step 1: Automated Verification
Run the automated build and type-check script. This catches syntax errors (like missing semicolons) and server configuration errors (`ssr: false`).

```bash
npm run verify
```

- **IF FAILS**: Stop. Fix the error. Run `npm run verify` again.
- **IF PASSES**: Proceed to Step 2.

### Step 2: Server Health & Environment Check
Ensure the development server is running cleanly.

1.  **Check for duplicate processes**:
    ```bash
    pgrep -f "next-server" | wc -l
    ```
    If count > 1, kill all and restart:
    ```bash
    pkill -f "next-server" || pkill -f "next dev" || true
    npm run dev
    ```
2.  **Verify Connectivity**:
    Use `read_url_content` on `http://localhost:3000` (or active port) to ensure it returns 200 OK.

### Step 3: Agentic Visual Verification (CRITICALLY IMPORTANT)
**Constraint**: You are PROHIBITED from submitting work without "seeing" it yourself.

1.  **Launch Browser Agent**:
    Call `browser_subagent` with a task to "Act as the user".
2.  **Verify Specifics**:
    - If you added a button -> Click it.
    - If you fixed a navigation bug -> Navigate.
    - If you made a UI change -> Screenshot it.
3.  **Stress Test**:
    - Click multiple links rapidly to check for "Internal Server Errors" or "Compiling Forever" states.

### Step 3b: Fallback - User Visual Check (If Browser Tool Fails)
If the `browser_subagent` fails with errors like "browser connection is reset" or "action timed out":

1.  **Do NOT skip verification.** Use `read_url_content` on `http://localhost:3000` to confirm the server returns 200 OK.
2.  **Request User Confirmation**: Use `notify_user` with:
    - `BlockedOnUser: true`
    - A clear message asking the user to manually verify the specific feature in their own browser.
    - Example: "Please open http://localhost:3000/season and confirm the map loads without errors."
3.  **Wait for user feedback** before marking the task complete.

### Troubleshooting Common Failures

If you encounter issues during verification, apply these specific fixes:

#### 1. "Nothing Changing" (Stale Code)
If your code edits are on disk but the browser shows old behavior (e.g. Map Hangs):
- **Diagnose**: Likely a corrupted Next.js build cache.
- **Fix (The Nuclear Option)**:
  ```bash
  pkill -f "next-server" || true
  rm -rf .next
  npm run dev
  ```
- **Then**: Hard Refresh the browser (`Cmd+Shift+R`).

#### 2. "Action Timed Out" / "Browser Connection Reset"
- **Diagnose**: Agent cannot connect to browser binary.
- **Fix**:
  - Ensure **Google Chrome** is installed.
  - Clear any custom "Chrome Binary Path" in settings (do not use Arc).
  - Restart the session if persistent.

#### 3. "Graphics System Failure" (WebGL)
- **Diagnose**: Headless browser cannot initialize PIXI.js/WebGL.
- **Fix**:
  - Rely on Step 2 (Server Health) + carefully verify code logic.
  - Use **Step 3b (User Fallback)** to ask the user to verify visually in their real browser.

## Final Output
Only AFTER all steps pass (or user confirms via fallback) can you generate your `walkthrough.md` and call `notify_user`.
