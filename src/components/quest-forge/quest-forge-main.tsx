"use client";

import { useState } from "react";
import { generateQuestlineAction, saveQuestlineAction } from "@/lib/forge-actions";
import { QuestlineAIOutput } from "@/lib/ai/quest-forge";
import { NewQuestForm } from "./new-quest-form";
import { QuestlinePreview } from "./questline-preview";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { QuestLibrary } from "./quest-library";
import { Button } from "@/components/ui/button";
import { SeasonProvider } from "@/components/season-context";

interface QuestForgeMainProps {
    seasonId: string;
    seasonTitle: string;
    initialQuestlines: any[];
    standaloneQuests: any[];
    availableSeasons: { id: string; title: string }[];
}

export function QuestForgeMain({ seasonId, seasonTitle, initialQuestlines, standaloneQuests, availableSeasons }: QuestForgeMainProps) {
    const [activeTab, setActiveTab] = useState<"forge" | "library">("forge");
    const [selectedSeasonId, setSelectedSeasonId] = useState(seasonId);

    // Derived title for current selection
    const currentSeasonTitle = availableSeasons.find(s => s.id === selectedSeasonId)?.title || seasonTitle;

    const [result, setResult] = useState<QuestlineAIOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleGenerate(goal: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await generateQuestlineAction(goal, currentSeasonTitle);
            if (res.success && res.data) {
                setResult(res.data);
            } else {
                setError(res.error || "Failed to generate.");
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(dataToSave: QuestlineAIOutput) {
        setLoading(true);
        try {
            const res = await saveQuestlineAction(selectedSeasonId, dataToSave);
            if (res.success) {
                // Switch to library view after saving
                setActiveTab("library");
                setResult(null);
                router.refresh();
            } else {
                setError("Failed to save questline.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to save.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SeasonProvider>
            <div className="space-y-8">
                <div className="flex gap-4 border-b border-border/50 pb-2">
                    <Button
                        variant={activeTab === "forge" ? "primary" : "ghost"}
                        onClick={() => setActiveTab("forge")}
                    >
                        Forge New
                    </Button>
                    <Button
                        variant={activeTab === "library" ? "primary" : "ghost"}
                        onClick={() => setActiveTab("library")}
                    >
                        Quest Library
                    </Button>
                </div>

                {activeTab === "library" ? (
                    <QuestLibrary
                        questlines={initialQuestlines}
                        standaloneQuests={standaloneQuests}
                    />
                ) : (
                    <div className="space-y-8">
                        {!result && (
                            <NewQuestForm
                                onGenerate={handleGenerate}
                                loading={loading}
                                availableSeasons={availableSeasons}
                                selectedSeasonId={selectedSeasonId}
                                onSeasonChange={setSelectedSeasonId}
                            />
                        )}

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200">
                                {error}
                            </div>
                        )}

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <QuestlinePreview
                                        data={result}
                                        onSave={(data: QuestlineAIOutput) => handleSave(data)}
                                        onDiscard={() => setResult(null)}
                                        saving={loading}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </SeasonProvider>
    );
}
