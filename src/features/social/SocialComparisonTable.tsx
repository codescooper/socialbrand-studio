import type { SocialAccountRecord, SocialMetricSnapshotRecord } from "../../types/social";
import { calculateEngagementRate, compareMetric, primaryMetricForPlatform, sumInteractions } from "./socialHealthService";
import { formatMetric, PLATFORM_LABELS } from "./socialUi";

export function SocialComparisonTable({ accounts, histories }: { accounts: SocialAccountRecord[]; histories: Map<string, SocialMetricSnapshotRecord[]> }) {
  return (
    <section className="social-panel" aria-labelledby="social-comparison-title">
      <h2 id="social-comparison-title">Comparaison des plateformes</h2>
      <div className="social-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Plateforme</th>
              <th>Abonnés</th>
              <th>Évolution</th>
              <th>Portée ou vues</th>
              <th>Interactions</th>
              <th>Engagement</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length ? (
              accounts.map((account) => {
                const history = histories.get(account.id) || [];
                const latest = history.at(-1);
                const previous = history.at(-2);
                const followers = latest?.metrics.followers ?? null;
                const change = compareMetric(followers, previous?.metrics.followers ?? null).changePercent;
                const primary = latest?.metrics[primaryMetricForPlatform(account.platform)] ?? null;
                const interactions = latest ? sumInteractions([latest]) : null;
                return (
                  <tr key={account.id}>
                    <th scope="row">{PLATFORM_LABELS[account.platform]}</th>
                    <td>{formatMetric(followers)}</td>
                    <td>{formatMetric(change, "%")}</td>
                    <td>{formatMetric(primary)}</td>
                    <td>{formatMetric(interactions)}</td>
                    <td>{formatMetric(calculateEngagementRate(interactions, primary), "%")}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>Données indisponibles — associez d’abord un profil social.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
