import type { SocialAccountRecord, SocialMetricSnapshotRecord } from "../../types/social";
import { calculateEngagementRate, compareMetric, sumInteractions, sumMetric } from "./socialHealthService";
import { formatMetric } from "./socialUi";

export function SocialHealthOverview({ accounts, histories }: { accounts: SocialAccountRecord[]; histories: Map<string, SocialMetricSnapshotRecord[]> }) {
  const latest = accounts.flatMap((account) => histories.get(account.id)?.at(-1) || []);
  const previous = accounts.flatMap((account) => histories.get(account.id)?.at(-2) || []);
  const audience = sumMetric(latest, "followers");
  const previousAudience = previous.length === accounts.length ? sumMetric(previous, "followers") : null;
  const evolution = compareMetric(audience, previousAudience).changePercent;
  const reach = sumMetric(latest, "reach");
  const interactions = sumInteractions(latest);
  const engagement = calculateEngagementRate(interactions, reach);
  const posts = sumMetric(latest, "published_posts");
  const items = [
    ["Audience totale", formatMetric(audience)],
    ["Évolution des abonnés", formatMetric(evolution, "%")],
    ["Portée", formatMetric(reach)],
    ["Interactions", formatMetric(interactions)],
    ["Taux d’engagement", formatMetric(engagement, "%")],
    ["Contenus publiés", formatMetric(posts)],
  ];
  return (
    <section className="social-health-section" aria-labelledby="social-health-title">
      <div className="social-section-heading">
        <div>
          <span>SANTÉ DIGITALE</span>
          <h2 id="social-health-title">Résumé disponible</h2>
        </div>
        <p>Les indicateurs apparaissent uniquement lorsqu’un snapshot réel existe dans le stockage local.</p>
      </div>
      <div className="social-metric-grid">
        {items.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong className={value === "Données indisponibles" ? "unavailable" : ""}>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
