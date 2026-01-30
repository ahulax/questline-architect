"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

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

export async function logout() {
    // We need to import signOut from auth.ts, but that's Node-only.
    // Actually, we can just call it here?
    const { signOut } = await import("@/auth");
    await signOut();
}
