
"use client";

import dynamic from "next/dynamic";

const MapCanvas = dynamic(
    () => import("@/components/map/season-map-canvas").then((mod) => mod.SeasonMapCanvas),
    { ssr: false, loading: () => <div className="h-full w-full bg-[#111] animate-pulse rounded-xl" /> }
);

export function SeasonMapWrapper({ seasonId }: { seasonId: string }) {
    return <MapCanvas seasonId={seasonId} />;
}
