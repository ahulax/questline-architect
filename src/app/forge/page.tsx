import { QuestForge } from "@/components/quest-forge";
import { db } from "@/lib/db";
import { seasons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ForgePage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Fetch active season
    const [activeSeason] = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-display font-bold text-primary mb-2">The Quest Forge</h1>
                <p className="text-text-muted">Break down your ambitions into conquerable battles.</p>
            </header>

            {activeSeason ? (
                <QuestForge seasonId={activeSeason.id} />
            ) : (
                <div className="p-8 border border-white/10 rounded-lg text-center opacity-70">
                    <p>No active season found. Start a season to access the Forge.</p>
                </div>
            )}
        </div>
    );
}
