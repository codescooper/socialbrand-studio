import { describe, expect, it } from "vitest";
import { jsonResponse } from "./http";

describe("jsonResponse", () => {
  it("returns an empty body for a 204 preflight response", async () => {
    const response = jsonResponse({}, 204, "https://example.com");

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://example.com");
  });

  it("serializes JSON responses for non-empty statuses", async () => {
    const response = jsonResponse({ ok: true }, 200, "https://example.com");

    expect(await response.json()).toEqual({ ok: true });
  });
});
