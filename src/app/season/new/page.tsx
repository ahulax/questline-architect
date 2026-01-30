"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSeasonPlan, createSeason, type GeneratedSeason } from "@/lib/season-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, Sparkles, Sword, Shield, Skull } from "lucide-react";
import { clsx } from "clsx";

export default function SeasonWizard() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [goal, setGoal] = useState("");
    const [isPending, startTransition] = useTransition();
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedSeason | null>(null);

    // Boss Selection
    const [selectedBoss, setSelectedBoss] = useState("Chaos");
    const bosses = [
        { id: "Chaos", description: "Overwhelming disorder and lack of focus.", icon: Skull },
        { id: "Perfectionism", description: "Fear of shipping imperfect work.", icon: Shield },
        { id: "Burnout", description: "Exhaustion from unsustainable pace.", icon: Sword },
    ];

    const handleGenerate = () => {
        if (!goal) return;
        startTransition(async () => {
            const plan = await generateSeasonPlan(goal, selectedBoss);
            if (plan) {
                // Map default images for the wizard
                const imgMap: Record<string, string> = {
                    "Chaos": "/enemies/chaos_boss.png",
                    "Perfectionism": "/enemies/bureaucracy_golem.png",
                    "Burnout": "/enemies/toxic_slime.png"
                };
                plan.bossImageUrl = imgMap[selectedBoss];
            }
            setGeneratedPlan(plan);
            setStep(3);
        });
    };

    const handleCreate = () => {
        if (!generatedPlan) return;
        startTransition(async () => {
            await createSeason(generatedPlan);
            router.push("/"); // Redirect to dashboard
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-12">
            <header className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    New Campaign
                </h1>
                <p className="text-text-secondary">Turn your ambition into a playable season.</p>
            </header>

            {/* Steps Indicator */}
            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={clsx(
                            "w-3 h-3 rounded-full transition-colors",
                            s === step ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-bg-panel border border-border-subtle"
                        )}
                    />
                ))}
            </div>

            <Card className="min-h-[400px] flex flex-col p-8">

                {/* Step 1: Goal & Boss */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4">
                            <label className="block text-lg font-bold">What is your Main Quest?</label>
                            <Input
                                placeholder="e.g. Build an MVP in 4 weeks..."
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="text-lg py-6"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-lg font-bold">Choose your Nemesis</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {bosses.map((boss) => {
                                    const Icon = boss.icon;
                                    const isSelected = selectedBoss === boss.id;
                                    return (
                                        <div
                                            key={boss.id}
                                            onClick={() => setSelectedBoss(boss.id)}
                                            className={clsx(
                                                "cursor-pointer p-4 rounded-lg border transition-all hover:bg-bg-panel/50",
                                                isSelected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(255,77,77,0.2)]"
                                                    : "border-border-subtle bg-transparent"
                                            )}
                                        >
                                            <Icon className={clsx("w-8 h-8 mb-3", isSelected ? "text-primary" : "text-text-muted")} />
                                            <div className="font-bold mb-1">{boss.id}</div>
                                            <div className="text-xs text-text-secondary leading-snug">{boss.description}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleGenerate}
                                disabled={!goal || isPending}
                                size="lg"
                                className="w-full md:w-auto gap-2"
                            >
                                {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                {isPending ? "Consulting the Oracle..." : "Generate Season"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review (Skipping 2 as generate handles it) */}
                {step === 3 && generatedPlan && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div>
                            <div className="text-sm text-text-muted uppercase tracking-wider mb-1">Season Preview</div>
                            <h2 className="text-2xl font-bold text-accent">{generatedPlan.title}</h2>
                            <p className="text-text-secondary">{generatedPlan.description}</p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {generatedPlan.questlines.map((ql, i) => (
                                <div key={i} className="p-4 rounded-lg bg-bg-panel border border-border-subtle">
                                    <h3 className="font-bold text-lg mb-1">{ql.title}</h3>
                                    <p className="text-xs text-text-muted mb-3">{ql.description}</p>
                                    <div className="space-y-2">
                                        {ql.quests.map((q, j) => (
                                            <div key={j} className="flex justify-between items-center text-sm p-2 bg-bg-void/50 rounded">
                                                <span>{q.title}</span>
                                                <span className={clsx("text-xs font-mono px-2 py-0.5 rounded border border-border-subtle", {
                                                    "text-status-active border-status-active/30": q.type === 'main',
                                                    "text-text-muted": q.type !== 'main'
                                                })}>
                                                    {q.effort}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleCreate} disabled={isPending} className="gap-2">
                                {isPending ? <Loader2 className="animate-spin" /> : <Sword />}
                                Begin Adventure
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
