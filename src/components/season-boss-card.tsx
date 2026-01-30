"use client";

import { Card } from "@/components/ui/card";
import { useSeason } from "@/components/season-context";
import { useEffect } from "react";

interface SeasonBossCardProps {
    season: {
        id: string;
        title: string;
        bossType: string;
        bossImageUrl?: string | null;
        bossHpCurrent: number;
        bossHpMax: number;
        xpCurrent: number;
        xpLevel: number;
    };
}

export function SeasonBossCard({ season }: SeasonBossCardProps) {
    const { state, initialize } = useSeason();

    // Initialize context with server data on mount
    useEffect(() => {
        initialize({
            bossHpCurrent: season.bossHpCurrent,
            bossHpMax: season.bossHpMax,
            xpCurrent: season.xpCurrent,
            xpLevel: season.xpLevel,
        });
    }, [season.id]); // Re-init if season changes, otherwise keep local state

    // Use local optimistic state if available, otherwise server data
    const display = state || {
        bossHpCurrent: season.bossHpCurrent,
        bossHpMax: season.bossHpMax,
        xpCurrent: season.xpCurrent,
        xpLevel: season.xpLevel,
    };

    const bossImage = season.bossImageUrl || "/enemies/chaos_boss.png";

    return (
        <Card className="bg-bg-panel border-alert/20 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-red-400 uppercase tracking-tight">BOSS: {season.bossType}</h3>
                    <span className="text-xs font-mono text-text-muted">LVL {display.xpLevel}</span>
                </div>

                {/* Higher Quality Boss Visual */}
                <div className="aspect-[4/3] bg-black/40 rounded-lg mb-4 flex items-center justify-center border border-border-subtle group relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                    <img
                        src={bossImage}
                        alt={season.bossType}
                        className="w-full h-full object-contain p-4 filter drop-shadow-[0_0_20px_rgba(255,0,0,0.3)] group-hover:scale-110 transition-transform duration-700"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary">
                        <span>HP</span>
                        <span>{display.bossHpCurrent} / {display.bossHpMax}</span>
                    </div>
                    <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--primary)]"
                            style={{ width: `${(display.bossHpCurrent / display.bossHpMax) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border-subtle">
                    <div className="flex justify-between font-mono text-xs text-accent">
                        <span>XP</span>
                        <span>{display.xpCurrent} (Next Level: {display.xpLevel * 100})</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
