import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === "/";
            const isOnProtected = nextUrl.pathname.startsWith("/season") || nextUrl.pathname.startsWith("/inventory") || nextUrl.pathname.startsWith("/recap");
            const isOnLogin = nextUrl.pathname === "/login";

            if (isOnProtected || isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login
            }

            if (isOnLogin && isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl));
            }

            return true;
        },
        session({ session, user, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
