import type { SocialAccountRecord, SocialMetricSnapshotRecord } from "../../types/social";
import { sumInteractions, sumMetric } from "./socialHealthService";
import { formatMetric } from "./socialUi";

export function SocialHealthAxes({ accounts, histories }: { accounts: SocialAccountRecord[]; histories: Map<string, SocialMetricSnapshotRecord[]> }) {
  const latest = accounts.flatMap((account) => histories.get(account.id)?.at(-1) || []);
  const axes = [
    ["Audience", sumMetric(latest, "followers")],
    ["Visibilité", sumMetric(latest, "reach")],
    ["Engagement", sumInteractions(latest)],
    ["Régularité", sumMetric(latest, "published_posts")],
    ["Efficacité", sumMetric(latest, "clicks")],
  ] as const;
  return (
    <section className="social-panel" aria-labelledby="social-axes-title">
      <h2 id="social-axes-title">Axes de lecture</h2>
      <p className="social-panel-note">Aucun score arbitraire n’est calculé. Chaque axe affiche uniquement une métrique disponible.</p>
      <div className="social-axis-list">
        {axes.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{formatMetric(value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
