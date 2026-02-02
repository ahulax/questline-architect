"use client";

import { useState, useTransition } from "react";
import { generateRecap, type RecapData } from "@/lib/recap-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Clapperboard, Sparkles, Trophy, Skull, Sword } from "lucide-react";

interface RecapClientProps {
    seasonId: string;
    initialData: RecapData | null;
}

export function RecapClient({ seasonId, initialData }: RecapClientProps) {
    const [data, setData] = useState<RecapData | null>(initialData);
    const [generating, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const newData = await generateRecap(seasonId);
            setData(newData);
        });
    };

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-bg-panel rounded-full flex items-center justify-center border-2 border-primary mb-4 shadow-[0_0_20px_var(--primary-glow)]">
                    <Clapperboard className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">The Director's Room</h1>
                <p className="text-text-secondary max-w-md">The Architect has been watching your progress. Are you ready for the weekly debrief?</p>

                <Button onClick={handleGenerate} disabled={generating} size="lg" className="gap-2 text-lg px-8 py-6">
                    {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {generating ? "Reviewing tapes..." : "Generate Episode Recap"}
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8">
            <header className="flex items-center justify-between border-b border-border-subtle pb-6">
                <div>
                    <div className="text-sm font-mono text-accent uppercase tracking-widest mb-2">Episode Report</div>
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        {data.episodeTitle}
                    </h1>
                </div>
                <div className="hidden md:block text-right">
                    <div className="text-xs text-text-muted">Generated</div>
                    <div className="font-mono text-sm">{new Date(data.generatedAt).toLocaleDateString()}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-8 leading-relaxed text-lg border-l-4 border-l-accent">
                    <div className="prose prose-invert">
                        <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-accent first-letter:float-left first-letter:mr-3">
                            {data.narrative}
                        </p>
                    </div>
                    <div className="mt-8 flex items-center gap-4 text-sm text-text-muted italic">
                        <div className="w-8 h-8 rounded-full bg-gray-700" />
                        <span>Dir. Architect</span>
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="bg-bg-panel p-6 flex flex-col items-center justify-center text-center gap-2">
                        <Trophy className="w-8 h-8 text-accent mb-2" />
                        <div className="text-3xl font-bold">{data.stats.xpGained}</div>
                        <div className="text-xs uppercase tracking-wider text-text-muted">XP Gained</div>
                    </Card>
                    <Card className="bg-bg-panel p-6 flex flex-col items-center justify-center text-center gap-2">
                        <Sword className="w-8 h-8 text-status-active mb-2" />
                        <div className="text-3xl font-bold">{data.stats.questsCompleted}</div>
                        <div className="text-xs uppercase tracking-wider text-text-muted">Quests Cleared</div>
                    </Card>
                    <Card className="bg-bg-panel p-6 flex flex-col items-center justify-center text-center gap-2">
                        <Skull className="w-8 h-8 text-primary mb-2" />
                        <div className="text-3xl font-bold">{data.stats.bossDamageDealt}</div>
                        <div className="text-xs uppercase tracking-wider text-text-muted">Boss DMG</div>
                    </Card>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button variant="ghost" onClick={() => setData(null)}>Back to Archive</Button>
            </div>
        </div>
    );
}
