"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map as MapIcon, RotateCcw, Gem, User, Home, Hammer } from "lucide-react"; // Added Hammer to imports
import { clsx } from "clsx";
import { LogoutButton } from "@/components/logout-button";

// Assuming Sword is a custom icon or needs to be imported from somewhere else if not lucide-react
// For now, I'll assume it's a placeholder or needs to be defined.
// If Sword is also from lucide-react, it should be added to the import list.
// For the purpose of this edit, I will keep Sword as is, as it's not part of the instruction's import changes.
// Similarly, Scroll is replaced by RotateCcw, so Scroll is no longer needed.
const Sword = LayoutDashboard; // Placeholder for Sword, assuming it's not defined elsewhere or needs a specific import.

const navItems = [
    { label: "Quest Forge", href: "/quest-forge", icon: Hammer },
    { href: "/", label: "Today", icon: Sword },
    { label: "Season Map", href: "/season", icon: MapIcon },
    { label: "Weekly Recap", href: "/recap", icon: RotateCcw },
    { label: "Armory", href: "/inventory", icon: Gem },
    // { href: "/profile", label: "Character", icon: User },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-bg-panel border-r border-border-subtle p-6 z-50">
            <div className="mb-8">
                <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
                    <Home className="w-6 h-6" />
                    <span>Questline</span>
                </h1>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Architect v1.0</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                            )}
                        >
                            <Icon className={clsx("w-5 h-5", isActive ? "text-primary" : "text-text-muted")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border-subtle mt-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div>
                        <div className="font-bold text-sm">Quest Hero</div>
                        <div className="text-xs text-text-muted">Lv. 1 Architect</div>
                    </div>
                </div>
                <LogoutButton />
                {/* Simple XP Bar */}
                <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-accent h-full w-[20%] shadow-[0_0_8px_var(--accent)]" />
                </div>
            </div>
        </aside>
    );
}
