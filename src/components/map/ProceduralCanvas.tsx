import { useEffect, useRef, useCallback, useState } from 'react';
import { Application } from 'pixi.js';
import type { SeasonMapProps } from '@/lib/map/lovable/types/map';
import { LayerManager } from '@/lib/map/lovable/rendering/LayerManager';
import { CameraController } from '@/lib/map/lovable/utils/CameraController';

/**
 * ProceduralCanvas Component
 * Main React component for the procedurally generated DnD map
 * Uses PixiJS for rendering with chunked terrain generation
 */

const ProceduralCanvas: React.FC<SeasonMapProps> = ({
    nodes,
    paths,
    currentSeasonId,
    onNodeClick,
    onNodeHover,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const layerManagerRef = useRef<LayerManager | null>(null);
    const cameraRef = useRef<CameraController | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    /**
     * Initialize PixiJS application
     */
    useEffect(() => {
        // Flag to handle strict mode double-mounting
        let isCancelled = false;
        let cleanupFn: (() => void) | null = null;

        const init = async () => {
            // Prevent multiple initializations (only if app already exists)
            if (appRef.current || !containerRef.current) return;

            try {
                const app = new Application();

                await app.init({
                    resizeTo: containerRef.current,
                    backgroundColor: 0x1a1a2e,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                });

                // If component unmounted while awaiting init, destroy app immediately
                if (isCancelled) {
                    app.destroy(true, { children: true });
                    return;
                }

                containerRef.current.appendChild(app.canvas);
                appRef.current = app;

                // Initialize layer manager
                const layerManager = new LayerManager();
                layerManagerRef.current = layerManager;
                app.stage.addChild(layerManager.getWorldContainer());

                // Initialize camera controller
                const camera = new CameraController(
                    layerManager.getWorldContainer(),
                    app.canvas as HTMLCanvasElement,
                    app.screen.width,
                    app.screen.height
                );
                cameraRef.current = camera;

                // Set up camera update callback
                camera.setOnUpdate((cameraX, cameraY, zoom) => {
                    if (!layerManagerRef.current || layerManagerRef.current.destroyed) return;
                    layerManager.updateTerrain(
                        cameraX,
                        cameraY,
                        app.screen.width,
                        app.screen.height,
                        zoom
                    );
                });

                // Handle resize
                const handleResize = () => {
                    if (containerRef.current && app && camera) {
                        camera.setViewportSize(app.screen.width, app.screen.height);
                        layerManager.updateTerrain(
                            camera.x,
                            camera.y,
                            app.screen.width,
                            app.screen.height,
                            camera.zoom
                        );
                    }
                };

                window.addEventListener('resize', handleResize);

                // Initial terrain load
                layerManager.updateTerrain(0, 0, app.screen.width, app.screen.height, 1);
                setIsInitialized(true);

                // Assign cleanup function for when effect cleans up
                cleanupFn = () => {
                    window.removeEventListener('resize', handleResize);

                    if (cameraRef.current) {
                        cameraRef.current.destroy();
                        cameraRef.current = null;
                    }

                    if (layerManagerRef.current) {
                        layerManagerRef.current.destroy();
                        layerManagerRef.current = null;
                    }

                    if (appRef.current) {
                        appRef.current.destroy(true, { children: true });
                        appRef.current = null;
                    }

                    setIsInitialized(false);
                };
            } catch (error) {
                console.error("Failed to initialize PixiJS app:", error);
            }
        };

        init();

        return () => {
            isCancelled = true;
            if (cleanupFn) cleanupFn();
        };
    }, []); // Empty dependency array - run once on mount

    /**
     * Update nodes and paths when props change
     */
    useEffect(() => {
        if (!isInitialized || !layerManagerRef.current) return;

        // Update discovery based on nodes
        layerManagerRef.current.updateDiscovery(nodes);

        // Refresh fog overlays
        layerManagerRef.current.refreshFog();

        // Render paths
        layerManagerRef.current.renderPaths(paths, nodes);

        // Render nodes
        layerManagerRef.current.renderNodes(nodes, onNodeClick, onNodeHover);
    }, [nodes, paths, onNodeClick, isInitialized]);

    /**
     * Center on first discovered node on initial load
     */
    useEffect(() => {
        if (!isInitialized || !cameraRef.current || !layerManagerRef.current) return;

        // Find first discovered node to center on
        const firstDiscovered = nodes.find(n => n.isDiscovered);
        if (firstDiscovered) {
            cameraRef.current.centerOn(firstDiscovered.x, firstDiscovered.y);

            // Update terrain for new position
            const app = appRef.current;
            const camera = cameraRef.current;
            if (app && camera) {
                layerManagerRef.current.updateTerrain(
                    camera.x,
                    camera.y,
                    app.screen.width,
                    app.screen.height,
                    camera.zoom
                );
            }
        }
    }, [isInitialized, nodes]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ touchAction: 'none' }}
        />
    );
};

export default ProceduralCanvas;
