"use client";

import { useTransition, useState } from "react";
import { Card } from "@/components/ui/card";
import { Circle, CheckCircle2, Swords } from "lucide-react";
import { clsx } from "clsx";
import { toggleQuestStatus } from "@/lib/actions";
import { motion } from "framer-motion";
import { itemVariants } from "./dashboard-animator";
import { QuestDetailModal } from "@/components/quest-forge/quest-detail-modal";
import { QuestCompletionModal } from "@/components/quest-completion-modal";
import confetti from "canvas-confetti";
import { SeasonProvider, useSeason } from "@/components/season-context";
import { getEnemyImage } from "@/lib/flavor-utils";
import { useRouter } from "next/navigation";
import { addQuestNoteAction } from "@/lib/forge-actions";

interface QuestProps {
    quest: {
        id: string;
        title: string;
        description: string | null;
        type: "main" | "side";
        effort: "S" | "M" | "L";
        status: "todo" | "in_progress" | "done" | "dropped";
        parentId: string | null;
        flavorData: string | null;
    };
    allQuests?: any[];

    depth?: number;
    showCombat?: boolean;
    hideOnComplete?: boolean;
}

export function QuestItem({ quest, allQuests = [], depth = 0, showCombat = false, hideOnComplete = false }: QuestProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const isDone = quest.status === "done";

    // Find children
    const children = allQuests.filter(q => q.parentId === quest.id);

    // Parse flavor safely
    let flavor = { enemyType: null, visual: null, enemyDescription: null };
    try {
        if (quest.flavorData) flavor = JSON.parse(quest.flavorData);
    } catch (e) { }

    const { damageBoss, addXp, triggerVictory, triggerReview } = useSeason();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDone) {
            // Instant Undo
            performToggle();
        } else {
            // Open Completion Modal
            setShowCompletionModal(true);
        }
    };

    const handleCompletionConfirmed = async (note: string) => {
        setShowCompletionModal(false);

        // 1. Save Note (if any)
        if (note.trim()) {
            try {
                await addQuestNoteAction(quest.id, note);
            } catch (e) {
                console.error("Failed to save note", e);
            }
        }

        // 2. Perform Toggle & Optimistic Updates
        performToggle(true);
    };

    const performToggle = (isCompleting: boolean = false) => {
        startTransition(async () => {
            // Optimistic XP/Damage Logic
            if (!isDone) { // If we are completing it right now
                const xpMap: Record<string, number> = { S: 5, M: 10, L: 20 };
                const damageMap: Record<string, number> = { S: 5, M: 15, L: 25 };

                const effortKey = quest.effort || 'S';
                const xp = xpMap[effortKey] || 5;
                const damage = damageMap[effortKey] || 5;

                try {
                    const rect = document.getElementById(`quest-card-${quest.id}`)?.getBoundingClientRect();
                    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
                    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

                    confetti({
                        particleCount: 60,
                        spread: 70,
                        origin: { x, y },
                        colors: ['#4ade80', '#ffffff', '#fbbf24']
                    });
                } catch (e) {
                    console.warn("Confetti failed", e);
                }

                addXp(xp);
                if (quest.type === 'main') damageBoss(damage);
            }

            try {
                await toggleQuestStatus(quest.id, quest.status);

                // If completing, fix the UI
                if (!isDone) {

                    // Optimistic Hide
                    setIsVisible(false);

                    // Trigger Victory ONLY (Review handled by modal input now)
                    if (quest.effort === 'L') {
                        triggerVictory(quest);
                    }
                }

                // Force a router refresh to ensure list is updated
                router.refresh();
            } catch (error) {
                console.error("Quest toggle failed:", error);

                // Revert optimistic updates if needed
                setIsVisible(true);
            }
        });
    };

    const displayEnemy = flavor.enemyType || `${quest.title.split(' ')[0]} ${quest.type === 'main' ? 'Wraith' : 'Mimic'}`;

    // Force hide if requested and done
    if (hideOnComplete && isDone) return null;
    if (!isVisible) return null;

    return (
        <div className="space-y-2">
            <motion.div variants={itemVariants} layout>
                <Card
                    id={`quest-card-${quest.id}`}
                    className={clsx(
                        "group transition-all flex items-center gap-4 p-4 select-none border-l-4 relative overflow-hidden",
                        isDone
                            ? "bg-bg-card/50 border-status-done/20 hover:border-status-done/50"
                            : "hover:border-primary border-transparent bg-bg-card",
                        isPending && "opacity-50 cursor-wait"
                    )}
                    style={{ marginLeft: `${depth * 1.5}rem` }}
                >
                    {isDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 0 }}
                            animate={{ opacity: [0, 1, 0], y: -30 }}
                            className="absolute right-4 top-2 font-bold text-accent pointer-events-none"
                        >
                            +{quest.effort === 'S' ? 5 : quest.effort === 'M' ? 10 : 20} XP
                        </motion.div>
                    )}

                    <button
                        onClick={handleClick}
                        disabled={isPending}
                        className={clsx(
                            "transition-colors z-10",
                            isDone ? "text-status-done" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>

                    <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setIsDetailOpen(true)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={clsx(
                                "font-medium text-lg transition-all flex items-center gap-2",
                                isDone ? "line-through text-text-muted" : "text-text-primary"
                            )}>
                                {quest.title}
                            </h3>
                            {showCombat && (
                                <div className="flex items-center gap-2">
                                    <Swords className="w-3.5 h-3.5 text-status-active" />
                                    <span className="text-[10px] font-mono text-status-active uppercase tracking-tighter">
                                        VS {displayEnemy}
                                    </span>
                                </div>
                            )}
                        </div>

                        {showCombat && (
                            <div className="flex gap-4 mb-3 items-center">
                                {/* Enemy Sprite */}
                                <div className="w-16 h-16 bg-black/40 rounded flex items-center justify-center border border-white/5 relative overflow-hidden group/sprite">
                                    <img
                                        src={getEnemyImage(displayEnemy, quest.id)}
                                        alt={displayEnemy}
                                        className={clsx(
                                            "w-12 h-12 object-contain transition-all duration-500",
                                            isDone ? "grayscale opacity-30 scale-75" : "group-hover/sprite:scale-110"
                                        )}
                                        style={!isDone ? {
                                            filter: `drop-shadow(0 0 8px rgba(255,0,0,0.3)) hue-rotate(${Math.abs(displayEnemy.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}deg)`
                                        } : undefined}
                                    />
                                    {isDone && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-red-500/80 text-white text-[8px] font-bold px-1 rotate-[-15deg] uppercase">Defeated</div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={false}
                                            animate={{ width: isDone ? "0%" : "100%" }}
                                            className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                                        />
                                    </div>
                                    <div className="text-[9px] font-mono text-text-muted mt-1 uppercase flex justify-between">
                                        <span>Enemy HP: {isDone ? "0" : "100"}/100</span>
                                        <span>Tier: {quest.effort}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 text-xs">
                            <span className={clsx("px-2 py-0.5 rounded bg-bg-void border border-border-subtle uppercase font-bold", {
                                "text-status-active border-status-active/30": quest.type === 'main',
                                "text-text-muted": quest.type !== 'main'
                            })}>
                                {quest.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-bg-void border border-border-subtle text-text-muted font-mono">
                                {quest.effort} ({quest.effort === 'S' ? 5 : quest.effort === 'M' ? 10 : 20} XP)
                            </span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {children.length > 0 && (
                <div className="space-y-2">
                    {children.map(child => (
                        <QuestItem
                            key={child.id}
                            quest={child}
                            allQuests={allQuests}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            <QuestDetailModal
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                quest={quest}
            />

            <QuestCompletionModal
                isOpen={showCompletionModal}
                onClose={() => setShowCompletionModal(false)}
                onComplete={handleCompletionConfirmed}
                questTitle={quest.title}
            />
        </div>
    );
}
