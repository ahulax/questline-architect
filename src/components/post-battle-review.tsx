"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addQuestNoteAction } from "@/lib/forge-actions";
import { BookOpen, Sparkles, Loader2, Send } from "lucide-react";

interface PostBattleReviewProps {
    isOpen: boolean;
    onClose: () => void;
    questId: string;
    questTitle: string;
}

export function PostBattleReview({ isOpen, onClose, questId, questTitle }: PostBattleReviewProps) {
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!note.trim()) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            await addQuestNoteAction(questId, note);
            onClose();
        } catch (error) {
            console.error("Failed to save note:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Post-Battle Review"
        >
            <div className="space-y-6">
                <div className="bg-bg-void/50 p-4 rounded-lg border border-border-subtle">
                    <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                        <BookOpen size={12} />
                        Architect's Observation
                    </div>
                    <p className="text-sm text-text-secondary italic">
                        "Your victory against <span className="text-white font-bold">{questTitle}</span> is recorded. What insights did you gain during this fight?"
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                        Combat Log / Notes
                        <span className="text-[9px] font-normal text-white/20 capitalize italic">AI used for Recap</span>
                    </label>
                    <Textarea
                        placeholder="e.g., 'Met unexpected resistance in the API documentation' or 'Drafted the core logic faster than expected.'"
                        className="min-h-[120px] bg-black/40 border-white/10 focus:border-accent/50 text-sm leading-relaxed"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isSaving}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-bold h-12 gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {isSaving ? "Filing Report..." : "Complete Reflection"}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full text-xs text-text-muted hover:text-white"
                    >
                        Skip Review
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted">
                    <Sparkles size={10} className="text-accent" />
                    <span>Notes help the Architect write more accurate Weekly Recaps</span>
                </div>
            </div>
        </Modal>
    );
}
