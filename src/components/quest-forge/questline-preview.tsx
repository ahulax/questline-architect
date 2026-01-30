"use client";

import { useState } from "react";
import { QuestlineAIOutput } from "@/lib/ai/quest-forge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Need to check if available, assuming standard shadcn
import { Badge } from "@/components/ui/badge"; // Assuming available
import { Trash2, Plus, Save, RotateCcw } from "lucide-react";

interface QuestlinePreviewProps {
    data: QuestlineAIOutput;
    onSave: (data: QuestlineAIOutput) => void;
    onDiscard: () => void;
    saving: boolean;
}

export function QuestlinePreview({ data, onSave, onDiscard, saving }: QuestlinePreviewProps) {
    // Local state for editing. For now, we only support basic editing, 
    // but if we want to modify the structure passed to onSave, we need to lift state or pass changes.
    // Actually, onSave takes no args and uses parent state? 
    // NO, `QuestForgeMain` uses `result` state. If I edit here, `QuestForgeMain` doesn't know.
    // I should probably pass an `onChange` or handle saving HERE by passing the modified data back to parent?
    // `QuestForgeMain` has `handleSave` which uses `result`.
    // I should update `QuestForgeMain` to accept updated data in `handleSave` or update `result` via `setResult`.
    // But `QuestForgeMain` didn't pass `setResult` or `onChange`.

    // Let's assume for V1 simplification I don't implement full editing in this file OR I fix the props.
    // Spec says "User edits quests".
    // I will assume I can't easily change props of `QuestlinePreview` without updating Main.
    // I will update Main later if needed, but for now I'll create this file and assume we only View or I'll add `onChange` prop and update Main next.

    // Wait, I just wrote `QuestForgeMain`. It passes `data`, `onSave`, `onDiscard`.
    // It does NOT pass a way to update `result`.
    // I need to update `QuestForgeMain` to pass `onUpdate` or similar.
    // Or `onSave` could accept the final data.

    // I will implement `QuestlinePreview` to accept `onSave(data: QuestlineAIOutput)` instead of void.
    // And update `QuestForgeMain` to match.

    const [questline, setQuestline] = useState(data.questline);

    const handleQuestChange = (index: number, field: string, value: any) => {
        const newQuests = [...questline.quests];
        newQuests[index] = { ...newQuests[index], [field]: value };
        setQuestline({ ...questline, quests: newQuests });
    };

    const handleSaveClick = () => {
        // Reconstruct full object
        const finalData: QuestlineAIOutput = { questline };
        // We need to pass this back. But `onSave` in Main is `() => handleSave()`.
        // I will cast it or update Main.
        // I'll update Main in a separate step or just assume I can change the signature in Main now? 
        // I already wrote Main. I can overwrite it.
        // Or I can use a hack? No, do it right.
        // I will output this file with `onSave: (data: QuestlineAIOutput) => void` and then update Main.
        onSave(finalData); // Error in Main currently
    };

    return (
        <Card className="p-6 border-primary/50 bg-background/90 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-primary">{questline.title}</h3>
                    <p className="text-text-muted">{questline.description}</p>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">Score: {questline.complexity_score}</Badge>
                        <Badge variant="outline">{questline.structure}</Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onDiscard()} disabled={saving}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Discard
                    </Button>
                    <Button onClick={handleSaveClick} disabled={saving} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save Campaign"}
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {questline.quests.sort((a, b) => a.order - b.order).map((q, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-accent/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="text-xl pt-1 min-w-[30px] text-center font-mono text-white/50">
                            {i + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Input
                                value={q.title}
                                onChange={(e) => handleQuestChange(i, "title", e.target.value)}
                                className="font-bold bg-transparent border-transparent hover:border-input focus:border-input px-0 h-auto py-0"
                            />
                            <Input
                                value={q.description}
                                onChange={(e) => handleQuestChange(i, "description", e.target.value)}
                                className="text-sm text-text-muted bg-transparent border-transparent hover:border-input focus:border-input px-0 h-auto py-0"
                            />
                            <div className="flex gap-2 mt-1">
                                <Badge variant={q.type === 'main' ? "default" : "secondary"} className="text-[10px] uppercase">
                                    {q.type}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                    Size: {q.effort}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
