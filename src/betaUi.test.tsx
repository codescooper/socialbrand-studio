import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { Onboarding } from "./components/Onboarding";
import { HelpPage } from "./features/help/HelpPage";
import { SocialPage } from "./features/social/SocialPage";
import { DEFAULT_BRAND_KIT } from "./constants/brandKitDefaults";
import { AuthProvider } from "./features/cloud/AuthProvider";

describe("interface bêta", () => {
  it("affiche uniquement des modules réels dans la navigation", () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    for (const label of ["Vue d&#x27;ensemble", "Projets", "Brand Kit", "Réseaux", "Produits", "Traitement par lot", "Exports", "Historique", "Paramètres", "Aide"])
      expect(html).toContain(label);
    expect(html).not.toContain("Templates");
    expect(html).not.toContain("Alex Morgan");
    expect(html).not.toContain("Beezy");
  });
  it("donne un nom accessible à l’onboarding", () => {
    const html = renderToStaticMarkup(<Onboarding onClose={() => undefined} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Étape 1 sur 4");
  });
  it("rend l’aide et le signalement explicites", () => {
    const html = renderToStaticMarkup(<HelpPage onRestartOnboarding={() => undefined} onReportIssue={() => undefined} />);
    expect(html).toContain("Questions fréquentes");
    expect(html).toContain("Aucune image ni donnée locale");
  });
  it("rend l’état vide Réseaux sans statistiques inventées", () => {
    const html = renderToStaticMarkup(
      <SocialPage brandKits={[DEFAULT_BRAND_KIT]} activeBrandKit={DEFAULT_BRAND_KIT} onBrandKitChange={() => undefined} onNotify={() => undefined} />,
    );
    for (const platform of ["Facebook", "Instagram", "TikTok", "LinkedIn"]) expect(html).toContain(platform);
    expect(html).toContain("Données indisponibles");
    expect(html).toContain("Connexion API bientôt disponible");
    expect(html).not.toContain("<strong>0</strong>");
  });
});
