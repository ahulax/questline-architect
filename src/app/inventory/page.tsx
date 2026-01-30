import { db } from "@/lib/db";
import { loot } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getDashboardData } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Gem, Shield, Sword, Crown } from "lucide-react";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const { user } = await getDashboardData() || {};

    if (!user) {
        return <div className="p-8">Please log in.</div>;
    }

    const items = await db
        .select()
        .from(loot)
        .where(eq(loot.userId, user.id))
        .orderBy(desc(loot.unlockedAt));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header>
                <h1 className="text-3xl font-bold mb-2">Armory</h1>
                <p className="text-text-secondary">Equipment earned through discipline and consistency.</p>
            </header>

            {items.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-border-subtle bg-transparent">
                    <div className="w-16 h-16 mx-auto bg-bg-void rounded-full flex items-center justify-center mb-4 text-text-muted">
                        <Gem className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Vault Empty</h3>
                    <p className="text-text-secondary">Level up by completing quests to unlock rewards.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        // Simple icon logic based on name/rarity for v1
                        let Icon = Gem;
                        if (item.name.includes("Sword")) Icon = Sword;
                        if (item.name.includes("Shield")) Icon = Shield;
                        if (item.name.includes("Helm") || item.name.includes("Crown")) Icon = Crown;

                        const isLegendary = item.rarity === "legendary";
                        const isRare = item.rarity === "rare";

                        return (
                            <Card key={item.id} className={clsx(
                                "relative group overflow-hidden border transition-all hover:-translate-y-1",
                                isLegendary ? "border-amber-500/50 bg-amber-950/10" :
                                    isRare ? "border-blue-500/50 bg-blue-950/10" :
                                        "border-border-subtle"
                            )}>
                                <div className={clsx(
                                    "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none bg-gradient-to-br",
                                    isLegendary ? "from-amber-500 to-transparent" :
                                        isRare ? "from-blue-500 to-transparent" :
                                            "from-white to-transparent"
                                )} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className={clsx(
                                        "p-3 rounded-lg",
                                        isLegendary ? "bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                                            isRare ? "bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" :
                                                "bg-bg-void text-text-muted"
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className={clsx(
                                        "text-xs uppercase tracking-wider font-mono px-2 py-0.5 rounded border",
                                        isLegendary ? "text-amber-500 border-amber-500/30 bg-amber-500/5" :
                                            isRare ? "text-blue-400 border-blue-400/30 bg-blue-400/5" :
                                                "text-text-muted border-border-subtle"
                                    )}>
                                        {item.rarity}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                                <p className="text-sm text-text-secondary">{item.description}</p>

                                <div className="mt-4 text-xs text-text-muted">
                                    Unlocked {new Date(item.unlockedAt!).toLocaleDateString()}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
