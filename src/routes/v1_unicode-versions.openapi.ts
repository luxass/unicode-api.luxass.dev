import { createRoute, z } from "@hono/zod-openapi";
import { ApiErrorSchema } from "../schemas";
import { UnicodeVersionSchema } from "./v1_unicode-versions.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: ["Misc"],
  description: "List all Unicode Versions available, including metadata.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UnicodeVersionSchema).openapi("UnicodeVersions"),
        },
      },
      description: "A list of Unicode versions with metadata.",
    },
    404: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Not Found",
    },
    500: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
});
