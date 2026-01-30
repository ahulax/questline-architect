"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { ChunkManager, CHUNK_SIZE } from "@/lib/map/chunk-manager";
import { getSeasonMapNodes, MapNode } from "@/lib/season-map-actions";
import { createTextureFromTemplate, createFogTexture, HOUSE_SMALL, SKULL_BOSS, TOWER_SMALL, PALETTE } from "@/lib/map/pixel-assets";

// We'll dynamically import PIXI and Viewport
let PIXI: any;
let ViewportClass: any;

interface SeasonMapCanvasProps {
    seasonId: string;
}

export function SeasonMapCanvas({ seasonId }: SeasonMapCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<any>(null);
    const chunkManagerRef = useRef<ChunkManager | null>(null);
    const initRef = useRef(false);
    const markersRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false); // HYDRATION FIX

    useEffect(() => { setIsClient(true); }, []); // HYDRATION FIX

    const [loading, setLoading] = useState(true);
    const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
    const nodesRef = useRef<MapNode[]>([]); // SYNC REF FOR TICKER

    const [logs, setLogs] = useState<string[]>([]);
    const [dataError, setDataError] = useState(false);
    const discoveredChunksRef = useRef<Set<string>>(new Set(["0,0"])); // Default start

    // Initial Zoom 0.8 (Legible)
    const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, zoom: 0.8 });
    const viewportRef = useRef({ x: 0, y: 0, scale: 0.8 });
    const isDraggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const addLog = (msg: string) => setLogs(p => [...p.slice(-4), msg]); // Keep last 5

    // Debug Log State
    const [statusLog, setStatusLog] = useState("Waiting...");
    const [initError, setInitError] = useState<any>(null);

    // Safety Valve: Force Loading False after 7s
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setStatusLog(prev => prev + " | FORCE OPEN");
            }
        }, 7000);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        let mounted = true;
        let appInstance: any = null;

        const initPixi = async () => {
            if (!mounted) return;

            // Wait for Container
            if (!containerRef.current) {
                console.warn("Container ref missing, retrying...");
                setTimeout(initPixi, 100);
                return;
            }

            // Lock (Prevent Double Init)
            if (initRef.current) {
                console.log("PIXI: Already initialized, skipping.");
                return;
            }
            initRef.current = true;
            console.log("PIXI: Initializing...");

            try {
                // 1. Start fetching data
                setStatusLog("Fetching Data...");
                const nodesPromise = getSeasonMapNodes(seasonId)
                    .catch(err => {
                        console.error("Data Fetch Error:", err);
                        setDataError(true);
                        return [];
                    });

                // 2. Import Pixi
                setStatusLog("Importing PIXI...");
                PIXI = await import("pixi.js");

                // Check container again after await
                if (!containerRef.current) return;

                setStatusLog("Initializing App...");
                const app = new PIXI.Application();

                await app.init({
                    resizeTo: containerRef.current,
                    backgroundColor: 0x111111,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                    preference: 'webgl', // Force WebGL to avoid WebGPU instability w/ Next.js
                });

                if (!mounted) {
                    app.destroy();
                    return;
                }

                containerRef.current.appendChild(app.canvas);
                appRef.current = app;
                appInstance = app;

                // ... inside world setup ...
                const world = new PIXI.Container();
                world.sortableChildren = true;
                app.stage.addChild(world);

                // --- Infinite Fog Background ---
                const fogTexture = createFogTexture(app, PIXI);
                const fogBg = new PIXI.TilingSprite({
                    texture: fogTexture,
                    width: 10000,
                    height: 10000
                });
                fogBg.label = "fog-bg";
                fogBg.anchor.set(0.5);
                fogBg.zIndex = -100; // Behind everything
                fogBg.alpha = 1;
                world.addChild(fogBg);

                // Initialize Manager with PIXI
                const manager = new ChunkManager(app, PIXI);
                chunkManagerRef.current = manager;

                // Initial Discovery
                // Initial Discovery (5x5 Grid around spawn)
                const discovered = new Set<string>();
                for (let y = -2; y <= 2; y++) {
                    for (let x = -2; x <= 2; x++) {
                        discovered.add(`${x},${y}`);
                    }
                }
                manager.setDiscoveredChunks(discovered);
                discoveredChunksRef.current = discovered; // SYNC REF IMMEDIATELY

                // Force Render 5x5 Grid
                for (let y = -2; y <= 2; y++) {
                    for (let x = -2; x <= 2; x++) {
                        const chunk = manager.getChunk(x, y);
                        chunk.zIndex = 0; // Explicitly set behind paths
                        // Add to world
                        world.addChild(chunk);
                        // Force update
                        manager.updateChunk(chunk, true);
                    }
                }
                world.sortChildren();

                // Hide Loading Screen
                setLoading(false);
                setStatusLog("Map Active");

                // ... (Rest of Data Handling Logic) -> I'll keep the rest of your logic below in a merged block or just target the init part.

                // --- Quest Path Layer ---
                const pathContainer = new PIXI.Container();
                pathContainer.zIndex = 50;
                pathContainer.label = "path-container";
                world.addChild(pathContainer);

                // --- Marker Layer ---
                const markerContainer = new PIXI.Container();
                markerContainer.zIndex = 100;
                markerContainer.label = "marker-container";
                world.addChild(markerContainer);
                markersRef.current = markerContainer;

                // 3. Handle Data 
                nodesPromise.then(async nodes => {
                    console.log("Nodes Loaded:", nodes.length);
                    setMapNodes(nodes);
                    nodesRef.current = nodes; // UPDATE REF

                    // ... discv logic ...
                    const newDiscovered = new Set<string>();
                    newDiscovered.add("0,0");
                    newDiscovered.add("0,1"); newDiscovered.add("0,-1");
                    newDiscovered.add("1,0"); newDiscovered.add("-1,0");

                    nodes.forEach(node => {
                        const cx = Math.floor(node.x / CHUNK_SIZE);
                        const cy = Math.floor(node.y / CHUNK_SIZE);
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                newDiscovered.add(`${cx + dx},${cy + dy}`);
                            }
                        }
                    });

                    manager.setDiscoveredChunks(newDiscovered);
                    discoveredChunksRef.current = newDiscovered;

                    // Trigger a re-render of everything immediately
                    // This will be caught by the ticker's "re-render" block or the initial one
                    console.log("Nodes & Discovery Synced");
                });

                // --- Input Handling (Native DOM - Most Reliable for Manual Viewport) ---
                const canvas = app.canvas;

                const onDown = (e: PointerEvent) => {
                    isDraggingRef.current = true;
                    lastPosRef.current = { x: e.clientX, y: e.clientY };
                    if (frameCount % 10 === 0) console.log("Interaction - Pointer Down");
                };

                const onMove = (e: PointerEvent) => {
                    if (!isDraggingRef.current) return;
                    const dx = e.clientX - lastPosRef.current.x;
                    const dy = e.clientY - lastPosRef.current.y;

                    // Safety guard: Ensure scale is valid and non-zero
                    const scale = viewportRef.current.scale || 0.8;

                    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                        const nextX = viewportRef.current.x - dx / scale;
                        const nextY = viewportRef.current.y - dy / scale;

                        // Only update if values are finite
                        if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
                            viewportRef.current.x = nextX;
                            viewportRef.current.y = nextY;
                        }

                        lastPosRef.current = { x: e.clientX, y: e.clientY };
                    }
                };

                const onUp = () => {
                    if (isDraggingRef.current) console.log("Interaction - Pointer Up");
                    isDraggingRef.current = false;
                };

                canvas.addEventListener('pointerdown', onDown);
                window.addEventListener('pointermove', onMove, { passive: true });
                window.addEventListener('pointerup', onUp);

                const handleWheel = (e: WheelEvent) => {
                    if (e.ctrlKey) return;
                    e.preventDefault();
                    const delta = e.deltaY;
                    const zoomSpeed = 0.001;
                    const currentScale = viewportRef.current.scale;
                    const newScale = Math.max(0.1, Math.min(3.0, currentScale - delta * zoomSpeed));
                    viewportRef.current.scale = newScale;
                };
                canvas.addEventListener('wheel', handleWheel, { passive: false });

                // Loop
                let frameCount = 0;
                let texturesUpgraded = false; // RESTORED
                app.ticker.add(() => {
                    if (!world) return;
                    frameCount++;

                    const v = viewportRef.current;
                    const cx = app.screen.width / 2;
                    const cy = app.screen.height / 2;

                    // Centering Fix: Move (0,0) to Center of Screen
                    // world.x = cx - v.x * v.scale;
                    // world.y = cy - v.y * v.scale;

                    // Standard Viewport Logic
                    world.x = cx - v.x * v.scale;
                    world.y = cy - v.y * v.scale;
                    world.scale.set(v.scale);

                    // Dynamic Tile Loading
                    if (manager.isTexturesReady) {
                        const centerX = Math.floor(v.x / CHUNK_SIZE);
                        const centerY = Math.floor(v.y / CHUNK_SIZE);

                        // Load a generous grid around center
                        let activeChunks = 0;
                        for (let dy = -2; dy <= 2; dy++) {
                            for (let dx = -2; dx <= 2; dx++) {
                                const k = `${centerX + dx},${centerY + dy}`;
                                if (discoveredChunksRef.current.has(k)) {
                                    activeChunks++;
                                    const exists = world.children.find((c: any) => c.label === `chunk-${k}`);
                                    if (!exists) {
                                        const chunk = manager.getChunk(centerX + dx, centerY + dy);
                                        chunk.zIndex = 0;
                                        world.addChild(chunk);
                                        manager.updateChunk(chunk, true);
                                        world.sortChildren();
                                    }
                                }
                            }
                        }
                        if (frameCount % 60 === 0) {
                            console.log(`[STABILITY] World: ${world.children.length} total objects | ${activeChunks} active chunks`);
                        }
                    }

                    // Update debug info occasionally (every 10 frames)
                    if (frameCount % 10 === 0) {
                        setDebugInfo({
                            x: Math.round(v.x),
                            y: Math.round(v.y),
                            zoom: Math.round(v.scale * 100) / 100
                        });

                        // Heartbeat log every 120 frames (~2s)
                        if (frameCount % 120 === 0) {
                            console.log(`[STABILITY] Pos: ${Math.round(v.x)}, ${Math.round(v.y)} | Zoom: ${v.scale} | Dragging: ${isDraggingRef.current}`);
                        }
                    }

                    // Drift Fog
                    const fogBg = world.children.find((c: any) => c.label === "fog-bg");
                    if (fogBg && (fogBg as any).tilePosition) {
                        (fogBg as any).tilePosition.x += 0.25;
                        (fogBg as any).tilePosition.y += 0.15;
                    }

                    // --- Final Refresh System (Once assets Ready AND nodes present) ---
                    if (manager.isTexturesReady && !texturesUpgraded && nodesRef.current.length > 0) {
                        texturesUpgraded = true;
                        console.log("[STABILITY] Performing Final High-Fidelity Refresh");
                        manager.clearCache();

                        // Clear old chunks
                        for (let i = world.children.length - 1; i >= 0; i--) {
                            const child: any = world.children[i];
                            if (child.label && child.label.startsWith("chunk-")) {
                                world.removeChild(child);
                                child.destroy({ children: true });
                            }
                        }

                        // Re-add discovered
                        discoveredChunksRef.current.forEach(key => {
                            const [cx, cy] = key.split(",").map(Number);
                            const chunk = manager.getChunk(cx, cy);
                            chunk.zIndex = 0;
                            world.addChild(chunk);
                            manager.updateChunk(chunk, true);
                        });

                        world.sortChildren();
                        renderQuestPaths(nodesRef.current, pathContainer);
                        renderMarkers(nodesRef.current, markersRef.current, manager.allTextures);
                    }
                });

                const hudInterval = setInterval(() => {
                    const v = viewportRef.current;
                    setDebugInfo({
                        x: Math.round(v.x),
                        y: Math.round(v.y),
                        zoom: Math.round(v.scale * 100) / 100
                    });
                }, 100);

            } catch (err) {
                console.error("[SeasonMap] Init Failed:", err);
                setStatusLog(`Error: ${err}`);
                setInitError(err);
                setDebugInfo(prev => ({ ...prev, zoom: -1 }));
            } finally {
                // setLoading(false); // ALWAYS remove loading screen - now handled earlier
            }
        };

        const timer = setTimeout(initPixi, 50); // Faster init
        return () => {
            if ((window as any).__MAP_HUD_INTERVAL) clearInterval((window as any).__MAP_HUD_INTERVAL);
            clearTimeout(timer);
            console.log("PIXI: Cleaning up...");

            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
            initRef.current = false;
        };
    }, [seasonId]);

    const renderQuestPaths = (nodes: MapNode[], container: any) => {
        if (!PIXI) return;
        console.log(`[RENDER] Rendering ${nodes.length} Quest Paths...`);
        container.removeChildren();

        // 1. Group nodes by Questline
        const groups: Record<string, MapNode[]> = {};
        nodes.forEach(n => {
            if (n.questlineId) {
                if (!groups[n.questlineId]) groups[n.questlineId] = [];
                groups[n.questlineId].push(n);
            }
        });

        // 2. Draw Paths for each group
        Object.values(groups).forEach(group => {
            // Sort by orderIndex to ensure a logical linear path
            const sorted = group.sort((a, b) => a.orderIndex - b.orderIndex);

            for (let i = 0; i < sorted.length - 1; i++) {
                const start = sorted[i];
                const end = sorted[i + 1];

                const g = new PIXI.Graphics();

                // Calculate control points for a smooth curve
                // We use a mid-point offset by a factor of the distance
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

                // Add a bit of "chaos" / natural bend
                const cp1x = midX + (Math.random() - 0.5) * dist * 0.2;
                const cp1y = midY + (Math.random() - 0.5) * dist * 0.2;

                // --- Road Base ---
                g.moveTo(start.x, start.y);
                g.quadraticCurveTo(cp1x, cp1y, end.x, end.y);
                g.stroke({ width: 64, color: 0x221100, alpha: 0.6 });

                // --- Main Worn Trail ---
                g.moveTo(start.x, start.y);
                g.quadraticCurveTo(cp1x, cp1y, end.x, end.y);
                g.stroke({ width: 24, color: 0x664422, alpha: 0.8 });

                // --- The "Thread of Fate" (HIGH VISIBILITY GLOW) ---
                g.moveTo(start.x, start.y);
                g.quadraticCurveTo(cp1x, cp1y, end.x, end.y);
                g.stroke({
                    width: 8,
                    color: 0xffdd44, // Bright solar gold
                    alpha: 1.0
                });

                // Add a very thick outer glow
                g.moveTo(start.x, start.y);
                g.quadraticCurveTo(cp1x, cp1y, end.x, end.y);
                g.stroke({ width: 12, color: 0xffaa00, alpha: 0.4 });

                container.addChild(g);
            }
        });

        // 3. Connect Questlines to the Boss (if applicable)
        const boss = nodes.find(n => n.type === 'boss');
        if (boss) {
            Object.values(groups).forEach(group => {
                const lastNode = group.sort((a, b) => b.orderIndex - a.orderIndex)[0];
                const g = new PIXI.Graphics();
                g.moveTo(lastNode.x, lastNode.y);
                g.lineTo(boss.x, boss.y);
                g.stroke({ width: 12, color: 0x443322, alpha: 0.2 });
                container.addChild(g);
            });
        }
    };

    const renderMarkers = (nodes: MapNode[], container: any, textures: any) => {
        if (!PIXI) return;
        console.log(`[RENDER] Rendering ${nodes.length} Markers...`);
        container.removeChildren();

        nodes.forEach(node => {
            const marker = new PIXI.Container();
            marker.x = node.x;
            marker.y = node.y;

            // --- Shadow ---
            const shadow = new PIXI.Graphics();
            shadow.ellipse(0, 0, 40, 20); // Bigger shadow for bigger POIs
            shadow.fill({ color: 0x000000, alpha: 0.2 });
            shadow.y = 5;
            marker.addChild(shadow);

            // --- New POI Sprite Selection ---
            let sprite;
            const tex = textures;

            if (node.type === 'boss') {
                sprite = new PIXI.Sprite(tex.FORTRESS || tex.boss);
            } else {
                const title = node.title.toLowerCase();
                const qTitle = node.questlineTitle?.toLowerCase() || "";

                if (title.includes("village") || qTitle.includes("village") || title.includes("town")) {
                    sprite = new PIXI.Sprite(tex.VILLAGE || tex.house);
                } else if (title.includes("circle") || title.includes("ancient") || title.includes("altar")) {
                    sprite = new PIXI.Sprite(tex.STONE_CIRCLE || tex.house);
                } else if (title.includes("ruin") || title.includes("remnant") || node.status === 'locked') {
                    sprite = new PIXI.Sprite(tex.RUINS || tex.house);
                } else if (title.includes("tower") || title.includes("keep") || title.includes("outpost")) {
                    sprite = new PIXI.Sprite(tex.TOWER || tex.tower);
                } else if (title.includes("fort") || title.includes("stronghold")) {
                    sprite = new PIXI.Sprite(tex.FORTRESS || tex.tower);
                } else {
                    // Default cycle through POIs based on index for variety
                    const poiList = [tex.VILLAGE, tex.STONE_CIRCLE, tex.RUINS, tex.TOWER];
                    const index = Math.abs(node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % poiList.length;
                    sprite = new PIXI.Sprite(poiList[index] || tex.house);
                }
            }

            sprite.anchor.set(0.5, 1);
            sprite.scale.set(0.6); // Scale down the 1024x1024 assets to ~600px

            // --- Circular Mask (Fix for baked checkerboard) ---
            const mask = new PIXI.Graphics();
            // The assets are 1024x1024, the POIs are roughly centered.
            // We'll mask a circle that fits the POI.
            mask.circle(0, -sprite.height * 0.45, sprite.width * 0.4);
            mask.fill(0xffffff);
            sprite.mask = mask;
            marker.addChild(mask);

            marker.addChild(sprite);

            // --- Label (Pill Background) ---
            const labelContainer = new PIXI.Container();
            labelContainer.y = -180; // Floating higher above big POIs

            const style = new PIXI.TextStyle({
                fontFamily: 'Inter, sans-serif',
                fontSize: 18,
                fill: 0xffffff,
                fontWeight: 'bold',
                dropShadow: {
                    alpha: 0.5,
                    blur: 4,
                    color: 0x000000,
                    distance: 2,
                }
            });
            const text = new PIXI.Text({ text: node.title.toUpperCase(), style });
            text.anchor.set(0.5, 0.5);

            const pill = new PIXI.Graphics();
            const paddingX = 16;
            const paddingY = 8;
            pill.roundRect(-text.width / 2 - paddingX, -text.height / 2 - paddingY, text.width + paddingX * 2, text.height + paddingY * 2, 12);
            pill.fill({ color: 0x000000, alpha: 0.7 });
            pill.stroke({ width: 2, color: node.status === 'completed' ? 0x9bb57c : 0xffffff, alpha: 0.4 });

            labelContainer.addChild(pill);
            labelContainer.addChild(text);
            marker.addChild(labelContainer);

            // Interactive
            marker.eventMode = 'static';
            marker.cursor = 'pointer';

            // Hover Effects
            marker.on('pointerenter', () => {
                marker.scale.set(1.1);
                marker.zIndex = 200;
            });
            marker.on('pointerleave', () => {
                marker.scale.set(1);
                marker.zIndex = 100;
            });
            marker.on('pointerdown', () => {
                alert(`${node.title}\nSTATUS: ${node.status}`);
            });

            container.addChild(marker);
        });
    };

    // React-side methods kept for Recenter button
    const recenter = () => { viewportRef.current = { x: 0, y: 0, scale: 0.8 }; };

    if (!isClient) {
        return <div className="w-full h-[85vh] bg-[#111111] rounded-xl flex items-center justify-center text-white/20">Initialising Graphics...</div>;
    }

    return (
        <div className="relative w-full h-[85vh] bg-[#111111] rounded-xl overflow-hidden border border-border-subtle shadow-inner group">

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-brand-primary animate-pulse space-y-2 pointer-events-none">
                    <span>Retrieving Cartography...</span>
                </div>
            )}
            {/* Show Init Error (Zoom -1) - Higher Z-Index */}
            {initError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="text-center p-8 border border-red-500/30 bg-red-900/10 rounded-lg max-w-lg">
                        <h3 className="font-medieval text-2xl text-red-500 mb-2">Graphics System Failure</h3>
                        <p className="text-red-400/70 font-mono text-sm mb-4">Map Active</p>
                        {/* Debug Info */}
                        <div className="text-xs text-left bg-black/50 p-4 rounded overflow-auto max-h-32 mb-4 font-mono text-red-300">
                            {initError ? JSON.stringify(initError, Object.getOwnPropertyNames(initError)) : statusLog}
                        </div>
                        <p className="text-xs text-text-muted">Try Chrome or Check Hardware Acceleration</p>
                    </div>
                </div>
            )}
            {dataError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-900/80 text-white text-xs rounded border border-red-500 pointer-events-none z-40">
                    Map Data Unreachable (Offline Mode)
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full cursor-move touch-none"
            />
            {/* HUD */}
            <div className="absolute top-4 right-4">
                <button onClick={recenter} className="p-2 bg-bg-panel border border-border-subtle rounded text-text-secondary hover:text-white" title="Recenter">
                    <LocateFixed className="w-5 h-5" />
                </button>
            </div>
            <div className="absolute top-4 left-4 text-white/30 text-xs font-mono select-none flex flex-col items-start gap-1">
                <div>Pos: {debugInfo.x}, {debugInfo.y} | Zoom: {debugInfo.zoom}x</div>
                <div>Status: {statusLog} | Ticker: {appRef.current?.ticker?.started ? "RUNNING" : "STOPPED"}</div>
                <div>Quests: {mapNodes.length}</div>
            </div>
        </div>
    );
}
