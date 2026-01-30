"use client";

import { logout } from "@/lib/auth-actions";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    return (
        <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
        </button>
    );
}
