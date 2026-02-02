
import { getDashboardData } from "@/lib/data";
import { getLatestRecap } from "@/lib/recap-actions";
import { RecapClient } from "./recap-client";

export const dynamic = "force-dynamic";

export default async function RecapPage() {
    const data = await getDashboardData();
    const activeSeason = data?.activeSeason;

    if (!activeSeason) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold">No Active Season</h2>
                <p className="text-text-secondary">Start a season to view your weekly recap.</p>
                <a href="/season/new" className="btn btn-primary px-4 py-2 bg-primary rounded text-white">Start Campaign</a>
            </div>
        );
    }

    // Server-side fetch of initial data
    const latestRecap = await getLatestRecap(activeSeason.id);
    const initialData = latestRecap?.data || null;

    return <RecapClient seasonId={activeSeason.id} initialData={initialData} />;
}
