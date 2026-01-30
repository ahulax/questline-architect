import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function getUser(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("Authorize: Starting...");
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log("Authorize: Fetching user for", email);
                    const user = await getUser(email);
                    if (!user) {
                        console.log("Authorize: User not found");
                        return null;
                    }

                    console.log("Authorize: Verifying password...");
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash || "");
                    if (passwordsMatch) {
                        console.log("Authorize: Password valid");
                        return user;
                    } else {
                        console.log("Authorize: Password mismatch");
                    }
                } else {
                    console.log("Authorize: Zod parse failed");
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});
