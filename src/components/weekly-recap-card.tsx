"use client";

import { Card } from "@/components/ui/card";
import { type RecapData } from "@/lib/recap-actions";
import { Trophy, Sword, Skull, Clapperboard, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface WeeklyRecapCardProps {
    recap: RecapData | null;
}

export function WeeklyRecapCard({ recap }: WeeklyRecapCardProps) {
    if (!recap) {
        return (
            <Card className="p-6 bg-bg-panel border-white/5 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clapperboard className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                    <h3 className="font-bold text-sm mb-1">No Recap Available</h3>
                    <p className="text-xs text-text-muted">Commence your first quest to begin the log.</p>
                </div>
                <a
                    href="/recap"
                    className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-bold border border-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-3 h-3" />
                    Initialize Recap
                </a>
            </Card>
        );
    }

    return (
        <Card className="bg-bg-panel border-accent/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clapperboard className="w-12 h-12 text-accent" />
            </div>

            <div className="relative z-10 p-5 space-y-4">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-accent uppercase tracking-widest mb-1">
                        <Sparkles className="w-3 h-3" />
                        Live Battle Log
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-2">
                        {recap.episodeTitle}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3 italic">
                        "{recap.narrative}"
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 p-2 rounded border border-white/5 text-center">
                        <Trophy className="w-3 h-3 text-accent mx-auto mb-1" />
                        <div className="text-sm font-bold">{recap.stats.xpGained}</div>
                        <div className="text-[8px] uppercase text-text-muted">XP</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5 text-center">
                        <Sword className="w-3 h-3 text-status-active mx-auto mb-1" />
                        <div className="text-sm font-bold">{recap.stats.questsCompleted}</div>
                        <div className="text-[8px] uppercase text-text-muted">Quests</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5 text-center">
                        <Skull className="w-3 h-3 text-primary mx-auto mb-1" />
                        <div className="text-sm font-bold">{recap.stats.bossDamageDealt}</div>
                        <div className="text-[8px] uppercase text-text-muted">DMG</div>
                    </div>
                </div>

                <a
                    href="/recap"
                    className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold border border-white/10 transition-colors uppercase tracking-wider text-text-secondary"
                >
                    View Full Episode
                </a>
            </div>
        </Card>
    );
}
