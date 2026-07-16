import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BRAND_KIT } from "../../constants/brandKitDefaults";
import { AuthProvider, useAuth } from "./AuthProvider";
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
    const html = renderToStaticMarkup(<CloudPage activeBrandKit={DEFAULT_BRAND_KIT} notify={vi.fn()} />);
    expect(html).toContain("Cloud non configuré");
    expect(html).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });
});
