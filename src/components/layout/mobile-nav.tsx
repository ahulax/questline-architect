"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Home, Map, ScrollText, Backpack, Hammer } from "lucide-react";

export function MobileNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/season", icon: Map, label: "Map" },
        { href: "/forge", icon: Hammer, label: "Forge" },
        { href: "/inventory", icon: Backpack, label: "Loot" },
        { href: "/recap", icon: ScrollText, label: "Recap" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-panel border-t border-border-subtle z-50 px-6 flex justify-between items-center bg-black/90 backdrop-blur-md">
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive ? "text-primary" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
