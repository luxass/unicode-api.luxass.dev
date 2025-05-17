import { z } from "@hono/zod-openapi";

export const UnicodeVersionSchema = z.object({
  version: z.string().openapi({
    description: "The version of the Unicode standard.",
  }),
  documentationUrl: z.string().url().openapi({
    description: "The URL to the Unicode version documentation.",
  }),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number").openapi({
    description: "The year of the Unicode version.",
  }),
  ucdUrl: z.string().url().openapi({
    description: "The URL to the Unicode Character Database (UCD) for this version.",
  }),
}).openapi("UnicodeVersion");
export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;
