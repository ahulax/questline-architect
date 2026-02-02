"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function authenticate(formData: FormData) {
    try {
        console.log("Auth Action: Attempting sign in...");
        await signIn("credentials", Object.fromEntries(formData));
        console.log("Auth Action: Sign in successful (should redirect)");
    } catch (error) {
        console.log("Auth Action: Caught error:", error);
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials." };
                default:
                    return { error: "Something went wrong." };
            }
        }
        throw error;
    }
}

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    if (!email || !password) return { error: "Missing fields" };

    try {
        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            return { error: "Email already taken" };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        await db.insert(users).values({
            id: uuidv4(),
            email,
            passwordHash,
            displayName: displayName || "Adventurer",
        });

        return { success: true };
    } catch (error) {
        console.error("Register Error:", error);
        return { error: "Registration failed" };
    }
}

export async function logout() {
    // We need to import signOut from auth.ts, but that's Node-only.
    // Actually, we can just call it here?
    const { signOut } = await import("@/auth");
    await signOut();
}
