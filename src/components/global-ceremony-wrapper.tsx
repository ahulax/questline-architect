"use client";

import { useSeason } from "@/components/season-context";
import { VictoryCeremony } from "./victory-ceremony";
import { PostBattleReview } from "./post-battle-review";

export function GlobalCeremonyWrapper() {
    const { victoryQuest, reviewQuest, clearVictory, clearReview, triggerReview } = useSeason();

    return (
        <>
            <VictoryCeremony
                show={!!victoryQuest}
                onComplete={() => {
                    const q = victoryQuest;
                    clearVictory();
                    // After victory, trigger the review for the same quest
                    if (q) triggerReview(q);
                }}
            />

            {reviewQuest && (
                <PostBattleReview
                    isOpen={!!reviewQuest}
                    onClose={() => clearReview()}
                    questId={reviewQuest.id}
                    questTitle={reviewQuest.title}
                />
            )}
        </>
    );
}
