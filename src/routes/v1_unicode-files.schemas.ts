import { z } from "@hono/zod-openapi";

export const BaseUnicodeVersionFileSchema = z.object({
  name: z.string().openapi({
    description: "The name of the file or directory.",
  }),

  path: z.string().openapi({
    description: "The path to the file or directory.",
  }),
});

export type UnicodeVersionFile = z.infer<typeof BaseUnicodeVersionFileSchema> & {
  children?: UnicodeVersionFile[];
};

export const UnicodeVersionFileSchema: z.ZodType<UnicodeVersionFile> = BaseUnicodeVersionFileSchema.extend({
  children: z.lazy(() => UnicodeVersionFileSchema.array()).optional().openapi({
    description: "The children of the directory, if it is a directory.",
  }),
});
