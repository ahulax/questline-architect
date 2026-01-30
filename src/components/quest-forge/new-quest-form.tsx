"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Or textarea? Goal might be long. Spec said "Types a goal in one line".
import { Card } from "@/components/ui/card";

interface NewQuestFormProps {
    onGenerate: (goal: string) => void;
    loading: boolean;
    availableSeasons?: { id: string; title: string }[];
    selectedSeasonId?: string;
    onSeasonChange?: (id: string) => void;
}

export function NewQuestForm({ onGenerate, loading, availableSeasons, selectedSeasonId, onSeasonChange }: NewQuestFormProps) {
    const [goal, setGoal] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal.trim()) return;
        onGenerate(goal);
    };

    return (
        <Card className="p-8 border-accent/20 bg-background/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-2">New Questline</h2>
            <p className="text-sm text-text-muted mb-6">
                What is your main goal? (e.g. "Launch my portfolio v1", "Run a 5k", "Finish the course")
            </p>

            {availableSeasons && availableSeasons.length > 0 && (
                <div className="mb-4">
                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold block mb-1">Target Season</label>
                    <select
                        value={selectedSeasonId}
                        onChange={(e) => onSeasonChange?.(e.target.value)}
                        className="w-full sm:w-auto bg-bg-void border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                    >
                        {availableSeasons.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="I want to..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    disabled={loading}
                    className="flex-1 text-lg py-6"
                    autoFocus
                />
                <Button
                    type="submit"
                    disabled={loading || !goal.trim()}
                    size="lg"
                    className="min-w-[140px]"
                >
                    {loading ? "Forging..." : "Forge Plan"}
                </Button>
            </form>
        </Card>
    );
}
