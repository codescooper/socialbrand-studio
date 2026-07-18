export const jsonResponse = (body: unknown, status = 200, origin = "") =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      vary: "Origin",
    },
  });

export function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin") || "";
  const configured = (Deno.env.get("ALLOWED_ORIGINS") || Deno.env.get("ALLOWED_RETURN_URLS") || "http://127.0.0.1:1420")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.includes(origin) ? origin : "";
}
