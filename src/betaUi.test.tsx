import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { Onboarding } from "./components/Onboarding";
import { HelpPage } from "./features/help/HelpPage";

describe("interface bêta", () => {
  it("affiche uniquement des modules réels dans la navigation", () => {
    const html = renderToStaticMarkup(<App />);
    for (const label of ["Vue d&#x27;ensemble", "Projets", "Brand Kit", "Produits", "Traitement par lot", "Exports", "Historique", "Paramètres", "Aide"])
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
});
