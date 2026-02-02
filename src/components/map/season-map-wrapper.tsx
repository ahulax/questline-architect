'use client';

import React, { useMemo } from 'react';
import LovableMapContainer from '@/components/map/LovableMapContainer';
import { mapSeasonDataToMap } from '@/lib/map/lovable/data-mapper';
import type { quests, questlines } from '@/db/schema';

type Quest = typeof quests.$inferSelect;
type Questline = typeof questlines.$inferSelect;

interface QuestlineWithQuests extends Questline {
    quests: Quest[];
}

interface SeasonMapWrapperProps {
    seasonId: string;
    mapData?: QuestlineWithQuests[]; // Optional, passed from server
}

export const SeasonMapWrapper: React.FC<SeasonMapWrapperProps> = ({ seasonId, mapData = [] }) => {
    // Memoize the mapping so it doesn't re-run on every render (though mapData is likely stable)
    const { nodes, paths } = useMemo(() => {
        return mapSeasonDataToMap(mapData);
    }, [mapData]);

    return (
        <div className="w-full h-full min-h-[500px]">
            <LovableMapContainer
                nodes={nodes}
                paths={paths}
                seasonId={seasonId}
            />
        </div>
    );
};
