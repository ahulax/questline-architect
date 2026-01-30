import { getDashboardData } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Sword } from "lucide-react";
import { QuestItem } from "@/components/quest-item";
import { DashboardAnimator } from "@/components/dashboard-animator";
import { SeasonProvider } from "@/components/season-context";
import { SeasonBossCard } from "@/components/season-boss-card";
import { WeeklyRecapCard } from "@/components/weekly-recap-card";
import { GlobalCeremonyWrapper } from "@/components/global-ceremony-wrapper";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();

  if (!data?.user) {
    return <div className="p-8">Please run the seed script locally.</div>;
  }

  const { activeSeason, quests, questlines: seasonQuestlines } = data;

  // --- Campaign Grouping Logic ---
  const groups = (seasonQuestlines || []).map(ql => {
    return {
      id: ql.id,
      title: ql.title,
      stats: (ql as any).stats || { done: 0, total: 0 },
      quests: quests.filter(q => q.questlineId === ql.id)
    };
  }).filter(g => g.quests.length > 0);

  const standaloneQuests = quests.filter(q => !q.questlineId);

  return (
    <DashboardAnimator>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Today's Campaign</h1>
          <p className="text-text-secondary">Defeat the chaos. One quest at a time.</p>
        </div>
        {activeSeason && (
          <div className="text-right bg-bg-panel px-4 py-2 rounded-lg border border-border-subtle">
            <div className="text-xs text-text-muted uppercase tracking-wider">Current Season</div>
            <div className="text-lg font-bold text-accent">{activeSeason.title}</div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Quest List (Left Col) */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sword className="w-5 h-5 text-primary" />
                Active Battles
              </h2>
              <div className="flex gap-4">
                <span className="text-sm text-text-muted">{groups.length} Campaigns</span>
                {standaloneQuests.length > 0 && (
                  <span className="text-sm text-text-muted">{standaloneQuests.length} Skirmishes</span>
                )}
              </div>
            </div>

            <div className="space-y-14">
              {groups.length === 0 && standaloneQuests.length === 0 ? (
                <div className="p-12 border border-dashed border-border-subtle rounded-lg text-center text-text-muted">
                  No active quests. Check your <a href="/season" className="underline">map</a> or visit the <a href="/quest-forge" className="underline font-bold text-white">Forge</a> to create new ones.
                </div>
              ) : (
                <>
                  {groups.map((group) => {
                    const progress = Math.round((group.stats.done / group.stats.total) * 100);
                    return (
                      <div key={group.id} className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                              Campaign: {group.title}
                            </h3>
                            <span className="text-[10px] font-mono text-text-muted uppercase">
                              Progress: {group.stats.done}/{group.stats.total} ({progress}%)
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-primary transition-all duration-1000 shadow-[0_0_8px_var(--primary)]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {group.quests.map((q) => (
                            <QuestItem key={q.id} quest={q} showCombat={true} />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {standaloneQuests.length > 0 && (
                    <div className="space-y-4">
                      <div className="items-center gap-3 hidden">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border-subtle" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted px-4">
                          Skirmishes (Standalone)
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border-subtle" />
                      </div>
                      <div className="space-y-3">
                        {standaloneQuests.map((q) => (
                          <QuestItem key={q.id} quest={q} showCombat={true} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Level / Season Boss (Right Col) */}
        <div className="space-y-6">
          {activeSeason ? (
            <SeasonBossCard season={activeSeason} />
          ) : (
            <Card>
              <div className="text-center py-8">
                <h3 className="font-bold mb-2">No Active Season</h3>
                <a href="/season/new" className="btn btn-primary">Start Campaign</a>
              </div>
            </Card>
          )}

          {/* New Forge Call to Action */}
          <div className="p-4 rounded border border-accent/20 bg-accent/5">
            <h4 className="font-bold text-sm mb-1 text-accent">Need Reinforcements?</h4>
            <p className="text-xs text-text-muted mb-3">Break down big tasks in the Forge.</p>
            <a href="/quest-forge" className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold border border-white/10 transition-colors">
              Go to Quest Forge
            </a>
          </div>

          {/* Weekly Recap Card */}
          <WeeklyRecapCard recap={(data as any).latestRecap} />
        </div>
      </div>
    </DashboardAnimator >
  );
}
