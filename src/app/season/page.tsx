
import { getSeasonMapData } from "@/lib/data";



// Dynamically import Canvas with no SSR to avoid Pixi window errors
import { SeasonMapWrapper } from "@/components/map/season-map-wrapper";

export const dynamic = "force-dynamic";

export default async function SeasonMap() {
    const data = await getSeasonMapData();

    if (!data || !data.activeSeason) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold">No Active Map</h2>
                <p className="text-text-secondary">Start a season to view your campaign map.</p>
                <a href="/season/new" className="btn btn-primary">Start Campaign</a>
            </div>
        );
    }

    const { activeSeason } = data;

    return (
        <div className="space-y-4 h-screen flex flex-col pb-4">
            <header className="flex items-center justify-between shrink-0 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {activeSeason.title}
                        <span className="text-xs font-normal text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            Infinite Canvas
                        </span>
                    </h1>
                </div>
                <div className="text-xs text-text-muted">
                    Season ID: {activeSeason.id.substring(0, 8)}
                </div>
            </header>

            {/* The Infinite Map Canvas */}
            <div className="flex-1 w-full relative">
                <SeasonMapWrapper seasonId={activeSeason.id} mapData={data.mapData} />
            </div>
        </div>
    );
}
