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
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    const handleNodeClick = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            // 1. Show Toast
            toast.message(node.title, {
                description: node.description || "No description provided",
            });

            // 2. Scroll to Quest Card
            const element = document.getElementById(`quest-card-${nodeId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add highlight effect
                element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                }, 2000);
            } else {
                console.warn(`Quest card element not found: quest-card-${nodeId}`);
            }
        }
    }, [nodes]);

    const handleNodeHover = useCallback((nodeId: string | null) => {
        setHoveredNodeId(nodeId);
    }, []);

    const hoveredNode = nodes.find(n => n.id === hoveredNodeId);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#1a1a2e] rounded-lg border border-white/10 shadow-inner">
            <ProceduralCanvas
                nodes={nodes}
                paths={paths}
                currentSeasonId={seasonId}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
            />

            {/* Hover Tooltip */}
            {hoveredNode && (
                <div className="absolute top-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 shadow-xl max-w-xs pointer-events-none select-none z-50 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-white font-bold text-sm mb-1">{hoveredNode.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded font-mono uppercase ${hoveredNode.status === 'done' ? 'bg-green-900/50 text-green-400 border border-green-700/50' :
                            hoveredNode.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50' :
                                'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                            {hoveredNode.status.replace('_', ' ')}
                        </span>
                        {hoveredNode.type !== 'town' && (
                            <span className="text-gray-500 capitalize">• {hoveredNode.type.replace('_', ' ')}</span>
                        )}
                    </div>
                </div>
            )}

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
