import { createClient } from "npm:@supabase/supabase-js@2.110.5";
import { allowedOrigin, jsonResponse } from "../_shared/http.ts";

type RequestBody = {
  action?: "create" | "link_brand_kit";
  name?: string;
  workspaceId?: string;
  localBrandKitId?: string;
  brandName?: string;
};

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return jsonResponse({ code: "origin_not_allowed", message: "Origine non autorisée." }, 403, "null");
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method !== "POST") return jsonResponse({ code: "method_not_allowed" }, 405, origin);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ code: "authentication_required", message: "Connexion requise." }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !publishableKey) return jsonResponse({ code: "server_not_configured", message: "Service indisponible." }, 503, origin);

  const client = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await client.auth.getUser(authorization.slice(7));
  if (userError || !userData.user) return jsonResponse({ code: "invalid_session", message: "Session invalide ou expirée." }, 401, origin);

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ code: "invalid_json", message: "Requête invalide." }, 400, origin);
  }

  if (body.action === "create") {
    const name = body.name?.trim() || "";
    if (!name || name.length > 100) return jsonResponse({ code: "invalid_workspace_name", message: "Nom d’espace invalide." }, 400, origin);
    const { data, error } = await client.rpc("create_business_workspace", { workspace_name: name });
    if (error) return jsonResponse({ code: "workspace_creation_failed", message: "Création impossible." }, 400, origin);
    return jsonResponse({ workspaceId: data }, 201, origin);
  }

  if (body.action === "link_brand_kit") {
    if (!body.workspaceId || !body.localBrandKitId || !body.brandName)
      return jsonResponse({ code: "invalid_brand_kit_link", message: "Informations du Brand Kit incomplètes." }, 400, origin);
    const { data, error } = await client.rpc("link_brand_kit", {
      target_workspace_id: body.workspaceId,
      target_local_brand_kit_id: body.localBrandKitId,
      target_brand_name: body.brandName,
    });
    if (error) return jsonResponse({ code: "brand_kit_link_failed", message: "Liaison impossible." }, 403, origin);
    return jsonResponse({ linkId: data }, 200, origin);
  }

  return jsonResponse({ code: "unsupported_action", message: "Action non prise en charge." }, 400, origin);
});
