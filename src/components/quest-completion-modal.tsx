"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";

interface QuestCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (note: string) => void;
    questTitle: string;
}

export function QuestCompletionModal({ isOpen, onClose, onComplete, questTitle }: QuestCompletionModalProps) {
    const [note, setNote] = useState("");
    const [isSubmitting, startTransition] = useTransition();

    const handleSubmit = () => {
        startTransition(() => {
            onComplete(note);
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Quest Complete"
        >
            <div className="space-y-6">
                <div className="bg-bg-void/50 p-4 rounded-lg border border-border-subtle">
                    <p className="text-sm text-text-secondary">
                        You are about to complete <span className="text-white font-bold">{questTitle}</span>.
                        <br />
                        Changes in the world are permanent.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                        Completion Note (Optional)
                        <span className="text-[9px] font-normal text-white/20 capitalize italic">For Weekly Recap</span>
                    </label>
                    <Textarea
                        placeholder="How did you solve it? Any key insights?"
                        className="min-h-[100px] bg-black/40 border-white/10 focus:border-accent/50 text-sm leading-relaxed"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover text-bg-void font-bold h-12 gap-2 text-lg"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    {isSubmitting ? "Finalizing..." : "Complete Quest"}
                </Button>
            </div>
        </Modal>
    );
}
