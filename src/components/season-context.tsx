"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SeasonState {
    xpCurrent: number;
    xpLevel: number;
    bossHpCurrent: number;
    bossHpMax: number;
}

interface SeasonContextType {
    state: SeasonState | null;
    initialize: (data: SeasonState) => void;
    addXp: (amount: number) => void;
    damageBoss: (amount: number) => void;
    undoStats: (xp: number, damage: number) => void;

    // Ceremony Triggers
    victoryQuest: any | null;
    reviewQuest: any | null;
    triggerVictory: (quest: any) => void;
    triggerReview: (quest: any) => void;
    clearVictory: () => void;
    clearReview: () => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SeasonState | null>(null);
    const [victoryQuest, setVictoryQuest] = useState<any | null>(null);
    const [reviewQuest, setReviewQuest] = useState<any | null>(null);

    const initialize = (data: SeasonState) => {
        if (!state) setState(data);
    };

    const addXp = (amount: number) => {
        if (!state) return;
        setState(prev => prev ? { ...prev, xpCurrent: prev.xpCurrent + amount } : null);
    };

    const damageBoss = (amount: number) => {
        if (!state) return;
        setState(prev => prev ? { ...prev, bossHpCurrent: Math.max(0, prev.bossHpCurrent - amount) } : null);
    };

    const undoStats = (xp: number, damage: number) => {
        if (!state) return;
        setState(prev => prev ? {
            ...prev,
            xpCurrent: Math.max(0, prev.xpCurrent - xp),
            bossHpCurrent: Math.min(prev.bossHpMax, prev.bossHpCurrent + damage)
        } : null);
    };

    const triggerVictory = (quest: any) => setVictoryQuest(quest);
    const triggerReview = (quest: any) => setReviewQuest(quest);
    const clearVictory = () => setVictoryQuest(null);
    const clearReview = () => setReviewQuest(null);

    return (
        <SeasonContext.Provider value={{
            state, initialize, addXp, damageBoss, undoStats,
            victoryQuest, reviewQuest, triggerVictory, triggerReview, clearVictory, clearReview
        }}>
            {children}
        </SeasonContext.Provider>
    );
}

export function useSeason() {
    const context = useContext(SeasonContext);
    if (context === undefined) {
        throw new Error("useSeason must be used within a SeasonProvider");
    }
    return context;
}
