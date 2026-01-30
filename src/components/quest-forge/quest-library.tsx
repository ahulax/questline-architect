"use client";

import { QuestItem } from "@/components/quest-item";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { clearStandaloneQuestsAction } from "@/lib/actions";

interface Quest {
    id: string;
    title: string;
    description: string | null;
    type: "main" | "side";
    effort: "S" | "M" | "L";
    status: "todo" | "in_progress" | "done" | "dropped";
    orderIndex: number;
    parentId: string | null;
    flavorData: string | null;
}

interface Questline {
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    quests: Quest[];
}

interface QuestLibraryProps {
    questlines: Questline[];
    standaloneQuests: Quest[];
}

export function QuestLibrary({ questlines, standaloneQuests }: QuestLibraryProps) {
    const [isPending, startTransition] = useTransition();
    const [openQuestlines, setOpenQuestlines] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState<"all" | "active" | "done">("active");

    const handleClearStandalone = () => {
        if (!confirm("Are you sure you want to clear ALL legacy standalone quests? This cannot be undone.")) return;
        startTransition(async () => {
            await clearStandaloneQuestsAction();
        });
    };

    const toggleQuestline = (id: string) => {
        setOpenQuestlines(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filterQuest = (q: Quest) => {
        const s = (q.status || "").toLowerCase().trim();
        if (filter === "active") return s === "todo" || s === "in_progress";
        if (filter === "done") return s === "done";
        return true;
    };

    const filteredQuestlines = questlines.map(ql => ({
        ...ql,
        quests: ql.quests.filter(filterQuest)
    })).filter(ql => ql.quests.length > 0);

    const filteredStandalone = standaloneQuests.filter(filterQuest);

    if (typeof window !== 'undefined') {
        console.log(`[QuestLibrary] Filter: ${filter}`, {
            standaloneTotal: standaloneQuests.length,
            standaloneFiltered: filteredStandalone.length,
            questlinesTotal: questlines.length,
            questlinesFiltered: filteredQuestlines.length
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 pb-2 border-b border-border/50">
                <Button
                    variant={filter === "active" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("active")}
                >
                    Active
                </Button>
                <Button
                    variant={filter === "done" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("done")}
                >
                    Completed
                </Button>
                <Button
                    variant={filter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("all")}
                >
                    All
                </Button>
            </div>

            <div className="space-y-4">
                {filteredQuestlines.length === 0 && filteredStandalone.length === 0 ? (
                    <div className="text-center py-12 text-text-muted bg-bg-card/30 rounded-xl border border-dashed border-border/50">
                        No {filter !== 'all' ? filter : ''} quests found.
                        {filter === 'active' ? " Forge a new goal to start your campaign!" : ""}
                    </div>
                ) : (
                    <>
                        {filteredQuestlines.sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0)).map((ql) => (
                            <div key={ql.id} className="space-y-2">
                                <Card
                                    className="p-0 border-primary/20 hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                                    onClick={() => toggleQuestline(ql.id)}
                                >
                                    <div className="p-4 flex items-center gap-4 bg-bg-card/50">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            {openQuestlines[ql.id] ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-text-primary leading-tight">{ql.title}</h3>
                                            <p className="text-sm text-text-muted line-clamp-1">{ql.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="h-6">
                                                {ql.quests.length} Quests
                                            </Badge>
                                            {openQuestlines[ql.id] ? <ChevronDown className="w-5 h-5 text-text-muted" /> : <ChevronRight className="w-5 h-5 text-text-muted" />}
                                        </div>
                                    </div>
                                </Card>

                                <AnimatePresence>
                                    {openQuestlines[ql.id] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden pl-4 border-l-2 border-primary/20 ml-5 space-y-3"
                                        >
                                            <div className="pt-2 space-y-3">
                                                {ql.quests
                                                    .filter(q => !q.parentId) // Only top level quests
                                                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                                    .map((q) => (
                                                        <QuestItem
                                                            key={q.id}
                                                            quest={q}
                                                            allQuests={ql.quests} // Pass the pool for recursion
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}

                        {filteredStandalone.length > 0 && (
                            <div className="pt-6 space-y-4">
                                <Card
                                    className="p-0 border-dashed border-border/50 bg-transparent hover:bg-bg-card/20 transition-all cursor-pointer overflow-hidden"
                                    onClick={() => setOpenQuestlines(prev => ({ ...prev, standalone: !prev.standalone }))}
                                >
                                    <div className="p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-bg-void flex items-center justify-center text-text-muted">
                                            <Folder className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                                    Legacy Standalone Quests ({filteredStandalone.length})
                                                </h4>
                                                <Badge variant="outline" className="text-[9px] border-yellow-500/20 text-yellow-500/60 h-4 px-1">Legacy Data</Badge>
                                            </div>
                                            <p className="text-[10px] text-text-muted/60 leading-none mt-0.5">Quests from previous sessions (Jan 15–26) not linked to a folder.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-text-muted hover:text-red-400 hover:bg-red-400/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearStandalone();
                                                }}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                            {openQuestlines.standalone ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                                        </div>
                                    </div>
                                </Card>

                                <AnimatePresence>
                                    {openQuestlines.standalone && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-3"
                                        >
                                            {filteredStandalone.map((q) => (
                                                <QuestItem key={q.id} quest={q} />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
