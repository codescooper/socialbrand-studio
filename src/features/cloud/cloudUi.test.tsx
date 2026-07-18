import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BRAND_KIT } from "../../constants/brandKitDefaults";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AppAccessGate } from "./AppAccessGate";
import { CloudPage } from "./CloudPage";

vi.mock("../../cloud/supabaseClient", () => ({ getSupabaseClient: () => null }));

function Status() {
  const auth = useAuth();
  return <span>{auth.configured ? "configuré" : "local"}</span>;
}

describe("fondation cloud", () => {
  it("conserve le mode local lorsque Supabase n’est pas configuré", () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <Status />
      </AuthProvider>,
    );
    expect(html).toContain("local");
  });

  it("explique la configuration manquante sans bloquer la PWA", () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <CloudPage activeBrandKit={DEFAULT_BRAND_KIT} notify={vi.fn()} />
      </AuthProvider>,
    );
    expect(html).toContain("Cloud non configuré");
    expect(html).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("présente la connexion avant le tableau de bord", () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AppAccessGate>
          <p>Tableau de bord privé</p>
        </AppAccessGate>
      </AuthProvider>,
    );
    expect(html).toContain("Bienvenue dans votre studio");
    expect(html).toContain("Essayer en local sans compte");
    expect(html).not.toContain("Tableau de bord privé");
  });
});
