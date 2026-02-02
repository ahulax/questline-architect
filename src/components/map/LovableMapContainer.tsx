'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { MapNode, QuestPath } from '@/lib/map/lovable/types/map';

// Dynamically import ProceduralCanvas to disable SSR (PixiJS requirement)
const ProceduralCanvas = dynamic(
    () => import('@/components/map/ProceduralCanvas'),
    { ssr: false, loading: () => <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center text-white/50">Loading Map...</div> }
);

interface LovableMapContainerProps {
    nodes: MapNode[];
    paths: QuestPath[];
    seasonId: string;
}

const LovableMapContainer: React.FC<LovableMapContainerProps> = ({
    nodes,
    paths,
    seasonId,
}) => {
    const handleNodeClick = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            toast.message(node.title, {
                description: node.description || "No description provided",
                action: {
                    label: "View",
                    onClick: () => console.log("Navigate to quest", node.id)
                }
            });
        }
    }, [nodes]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#1a1a2e] rounded-lg border border-white/10 shadow-inner">
            <ProceduralCanvas
                nodes={nodes}
                paths={paths}
                currentSeasonId={seasonId}
                onNodeClick={handleNodeClick}
            />

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 p-4 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg max-w-xs pointer-events-none select-none">
                <h3 className="text-white font-bold text-sm mb-1">World Map</h3>
                <p className="text-xs text-gray-400">
                    Scroll to zoom • Drag to pan
                </p>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg pointer-events-none select-none">
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
                        <span className="text-gray-300">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ffdd44] animate-pulse" />
                        <span className="text-gray-300">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-600" />
                        <span className="text-gray-500">Locked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LovableMapContainer;
