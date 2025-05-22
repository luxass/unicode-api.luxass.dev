import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { hasUCDPath, mapToUCDPathVersion, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { cache } from "hono/cache";
import { createError } from "../utils";
import { GET_UNICODE_FILES_BY_VERSION_ROUTE } from "./v1_unicode-files.openapi";

export const V1_UNICODE_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-files");

interface Entry {
  name: string;
  path: string;
  children?: Entry[];
}

interface UnicodeEntry {
  type: "file" | "directory";
  name: string;
  path: string;
}

V1_UNICODE_FILES_ROUTER.get("*", cache({
  cacheName: "unicode-api:files",
  cacheControl: "max-age=604800",
}));

V1_UNICODE_FILES_ROUTER.openapi(GET_UNICODE_FILES_BY_VERSION_ROUTE, async (c) => {
  const version = c.req.param("version");

  if (!UNICODE_VERSION_METADATA.map((v) => v.version)
    .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
    return createError(c, 400, "Unicode version does not have UCD");
  }

  const mappedVersion = mapToUCDPathVersion(version);
  if (!mappedVersion) {
    return createError(c, 400, "Invalid Unicode version");
  }

  const extraPath = hasUCDPath(mappedVersion) ? "/ucd" : "";
  // eslint-disable-next-line no-console
  console.info({
    version,
    mappedVersion,
    extraPath,
  });

  async function processDirectory(entries: UnicodeEntry[]): Promise<Entry[]> {
    // process all directories in parallel
    const dirPromises = entries
      .filter((entry) => entry.type === "directory")
      .map(async (dir) => {
        const response = await fetch(`${c.env.PROXY_URL}/${mappedVersion}${extraPath}/${dir.path}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch directory: ${dir.path}`);
        }
        const children = await response.json() as UnicodeEntry[];
        const processedChildren = await processDirectory(children);
        return {
          name: dir.name,
          path: dir.path,
          children: processedChildren,
        };
      });

    // process all files
    const fileEntries = entries
      .filter((entry) => {
        return entry.type === "file"
          && entry.name.endsWith(".txt")
          && (entry.name !== "ReadMe.txt.txt"
            || !entry.path.includes("draft")
            || !entry.path.includes("latest"));
      })
      .map((file) => ({
        name: file.name,
        path: file.path,
      }));

    const dirEntries = await Promise.all(dirPromises);

    return [...fileEntries, ...dirEntries];
  }
  console.log(`${c.env.PROXY_URL}/${mappedVersion}${extraPath}`);
  try {
    const response = await fetch(`${c.env.PROXY_URL}/${mappedVersion}${extraPath}`);
    if (!response.ok) {
      return createError(c, 502, "Failed to fetch root directory");
    }

    const rootEntries = await response.json() as UnicodeEntry[];
    const result = await processDirectory(rootEntries);
    return c.json(result, 200);
  } catch (error) {
    console.error("Error processing directory:", error);
    return createError(c, 500, "Failed to fetch file mappings");
  }
});
