"use client";

import { useSeason } from "@/components/season-context";
import { VictoryCeremony } from "./victory-ceremony";
import { PostBattleReview } from "./post-battle-review";

export function GlobalCeremonyWrapper() {
    const { victoryQuest, reviewQuest, clearVictory, clearReview, triggerReview } = useSeason();

    // Debug logging
    if (victoryQuest) console.log("GlobalCeremony: Victory Active", victoryQuest.id);
    if (reviewQuest) console.log("GlobalCeremony: Review Active", reviewQuest.id);

    return (
        <>
            <VictoryCeremony
                show={!!victoryQuest}
                onComplete={() => {
                    console.log("Victory Ceremony Complete. Triggering Review for:", victoryQuest?.id);
                    const q = victoryQuest;
                    clearVictory();
                    // After victory, trigger the review for the same quest
                    if (q) {
                        triggerReview(q);
                    } else {
                        console.error("Victory completed but no quest found in state");
                    }
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
