import type { HonoEnv } from "../types";
import type { UnicodeVersion } from "./v1_unicode-versions.schemas";
import { OpenAPIHono } from "@hono/zod-openapi";
import { mapUnicodeVersion } from "@luxass/unicode-utils";
import { cache } from "hono/cache";
import { createError } from "../utils";
import { LIST_ALL_UNICODE_VERSIONS_ROUTE } from "./v1_unicode-versions.openapi";

export const V1_UNICODE_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-versions");

V1_UNICODE_VERSIONS_ROUTER.get("*", cache({
  cacheName: "unicode-versions",
  cacheControl: "max-age=3600",
}));

V1_UNICODE_VERSIONS_ROUTER.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
  const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html");
  if (!response.ok) {
    return createError(c, 500, "Failed to fetch Unicode versions");
  }

  const html = await response.text();

  // find any table that contains Unicode version information
  const versionPattern = /Unicode \d+\.\d+\.\d+/;
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/g)?.find((table) =>
    versionPattern.test(table),
  );

  if (!tableMatch) {
    return createError(c, 404, "Unicode versions table not found");
  }

  const versions: UnicodeVersion[] = [];

  // match any row that contains a cell
  const rows = tableMatch.match(/<tr>[\s\S]*?<\/tr>/g) || [];

  for (const row of rows) {
    // look for Unicode version pattern in the row
    const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${versionPattern.source})\\s*</a>`));
    if (!versionMatch) continue;

    const documentationUrl = versionMatch[1];
    const version = versionMatch[2].replace("Unicode ", "");

    // look for a year pattern anywhere in the row
    const dateMatch = row.match(/<td[^>]*>(\d{4})<\/td>/);
    if (!dateMatch) continue;
    const ucdVersion = mapUnicodeVersion(version);

    const ucdUrl = `https://www.unicode.org/Public/${ucdVersion}/${ucdVersion.includes("Update") ? "" : "ucd"}`;

    versions.push({
      version,
      documentationUrl,
      date: dateMatch[1],
      ucdUrl,
    });
  }

  if (versions.length === 0) {
    return createError(c, 404, "No Unicode versions found");
  }

  // sort versions by date in descending order
  versions.sort((a, b) => Number.parseInt(b.date) - Number.parseInt(a.date));

  return c.json(versions, 200);
});
