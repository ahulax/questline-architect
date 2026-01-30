"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Swords } from "lucide-react";
import { getQuestNotesAction, addQuestNoteAction } from "@/lib/forge-actions";
import { getEnemyImage } from "@/lib/flavor-utils";

interface QuestDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quest: any;
}

export function QuestDetailModal({ open, onOpenChange, quest }: QuestDetailModalProps) {
    const [notes, setNotes] = useState<any[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [isSubmitting, startTransition] = useTransition();

    // Parse flavor
    let flavor = { enemyType: null, visual: null, enemyDescription: null };
    try {
        if (quest?.flavorData) flavor = JSON.parse(quest.flavorData);
    } catch (e) { }

    useEffect(() => {
        if (open && quest?.id) {
            setLoadingNotes(true);
            getQuestNotesAction(quest.id).then(res => {
                if (res.success && res.data) {
                    setNotes(res.data);
                }
                setLoadingNotes(false);
            });
        }
    }, [open, quest]);

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        startTransition(async () => {
            const res = await addQuestNoteAction(quest.id, newNote);
            if (res.success) {
                setNewNote("");
                // Refresh notes
                const updated = await getQuestNotesAction(quest.id);
                if (updated.success && updated.data) {
                    setNotes(updated.data);
                }
            }
        });
    };

    if (!quest) return null;

    const displayEnemy = flavor.enemyType || `${quest.title.split(' ')[0]} ${quest.type === 'main' ? 'Wraith' : 'Mimic'}`;

    return (
        <Modal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={quest.title}
        >
            <div className="space-y-6">
                {/* Enemy/Combatant Section */}
                <div className="flex gap-6 p-4 bg-red-950/20 rounded-xl border border-red-500/10 items-center">
                    <div className="w-24 h-24 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 overflow-hidden">
                        <img
                            src={getEnemyImage(displayEnemy, quest.id)}
                            alt={displayEnemy}
                            className="w-20 h-20 object-contain"
                            style={{
                                filter: `drop-shadow(0 0 10px rgba(220,38,38,0.3)) hue-rotate(${Math.abs(displayEnemy.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}deg)`
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-status-active uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Swords className="w-3 h-3" />
                            Combatant
                        </h4>
                        <div className="text-lg font-bold text-white mb-2">{displayEnemy}</div>
                        <p className="text-xs text-text-muted italic leading-relaxed">
                            "{flavor.enemyDescription || "A chaotic force standing between you and your goal."}"
                        </p>
                    </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-2 text-sm">
                    <Badge variant={quest.type === 'main' ? 'default' : 'secondary'}>{quest.type}</Badge>
                    <Badge variant="outline">{quest.effort}</Badge>
                    <span className="text-text-muted text-[10px] font-mono uppercase ml-auto">{quest.status}</span>
                </div>

                {/* Description */}
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Quest Briefing</h4>
                    <p className="text-text-secondary text-sm leading-relaxed p-4 bg-bg-void rounded-lg border border-border-subtle shadow-inner">
                        {quest.description || "No description provided."}
                    </p>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Field Notes</h4>

                    <div className="bg-black/20 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto space-y-4 border border-white/5">
                        {loadingNotes ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-text-muted" /></div>
                        ) : notes.length === 0 ? (
                            <div className="text-text-muted text-sm text-center italic py-4">No notes recorded yet.</div>
                        ) : (
                            notes.map((note) => (
                                <div key={note.id} className="text-sm space-y-1 border-b border-border/10 pb-2 last:border-0 last:pb-0">
                                    <div className="text-text-primary whitespace-pre-wrap">{note.text}</div>
                                    <div className="text-xs text-text-muted text-right">
                                        {new Date(note.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Log your progress..."
                            className="resize-none h-[60px] bg-bg-void border-border-subtle focus:border-primary text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNote();
                                }
                            }}
                        />
                        <Button
                            onClick={handleAddNote}
                            disabled={isSubmitting || !newNote.trim()}
                            className="h-auto self-stretch px-4"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
