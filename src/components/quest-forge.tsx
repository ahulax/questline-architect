"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { breakDownQuest, action_acceptQuest, ForgeResult } from "@/lib/forge-actions";
import { QuestlineData } from "@/lib/schemas/quest";
import { motion, AnimatePresence } from "framer-motion";

export function QuestForge({ seasonId }: { seasonId: string }) {
    const [goal, setGoal] = useState("");
    const [isForging, setIsForging] = useState(false);
    const [result, setResult] = useState<QuestlineData | null>(null);

    async function handleForge(e: React.FormEvent) {
        e.preventDefault();
        if (!goal.trim()) return;

        setIsForging(true);
        setResult(null);
        try {
            const data = await breakDownQuest(goal);
            setResult(data as any);
        } catch (err) {
            console.error(err);
        } finally {
            setIsForging(false);
        }
    }

    async function handleAccept() {
        if (!result) return;
        try {
            await action_acceptQuest(seasonId, result as any);
            window.location.reload(); // Simple refresh to show new quests
        } catch (err) {
            console.error("Failed to accept quest:", err);
        }
    }

    return (
        <div className="space-y-6">
            <Card className="p-6 border-accent/20 bg-background/50">
                <h3 className="text-xl font-bold mb-4 font-display">Quest Forge ⚒️</h3>
                <form onSubmit={handleForge} className="flex gap-4">
                    <Input
                        placeholder="Enter a major goal (e.g. 'Learn Three.js')"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        disabled={isForging || !!result}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isForging || !!result}>
                        {isForging ? "Forging..." : "Forge Quest"}
                    </Button>
                </form>
            </Card>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6 border-primary/50 bg-background/80 relative overflow-hidden">
                            {/* Boss Card Visual */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <span className="text-6xl">🐲</span>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-2xl font-bold text-primary">{result.questline.title}</h4>
                                <p className="text-text-muted italic">{result.questline.description}</p>
                                <div className="mt-2 text-sm text-blue-400 font-mono">
                                    SCORE: {result.questline.complexity_score} | STRUCT: {result.questline.structure.toUpperCase()}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {result.questline.quests.sort((a, b) => a.order - b.order).map((sub, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded bg-accent/5 border border-white/5">
                                        <div className="mt-1 text-xl">
                                            {/* Simple icon mapping based on effort */}
                                            {sub.effort === "S" ? "⚔️" : sub.effort === "M" ? "🛡️" : "🔥"}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold flex items-center gap-2">
                                                {sub.title}
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                                                    XP: {sub.effort === "S" ? 50 : sub.effort === "M" ? 100 : 200}
                                                </span>
                                            </h5>
                                            <p className="text-sm text-text-muted">{sub.description}</p>
                                            <div className="text-xs text-secondary mt-1 font-mono">
                                                {sub.type === "main" ? "MAIN QUEST" : "SIDE QUEST"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setResult(null)}>Discard</Button>
                                <Button onClick={handleAccept} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                    Accept Campaign
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
