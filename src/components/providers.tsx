"use client";

import { SeasonProvider } from "@/components/season-context";
import { GlobalCeremonyWrapper } from "@/components/global-ceremony-wrapper";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SeasonProvider>
            <GlobalCeremonyWrapper />
            {children}
        </SeasonProvider>
    );
}
