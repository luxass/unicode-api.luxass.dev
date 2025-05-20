import { z } from "@hono/zod-openapi";

export const ApiErrorSchema = z.object({
  path: z.string().openapi({
    description: "The path of the request",
  }),
  message: z.string().openapi({
    description: "The error message",
  }),
  status: z.number().openapi({
    description: "The HTTP status code",
  }),
  timestamp: z.string().openapi({
    description: "The timestamp of the error",
  }),
}).openapi("ApiError", {
  description: "An error response",
});

export const RateLimitErrorSchema = z.object({
  error: z.object({
    message: z.string().openapi({
      description: "A human-readable error message about the rate limit",
      example: "Too Many Requests - Please try again later",
    }),
    code: z.number().openapi({
      description: "The HTTP status code (429 for rate limit errors)",
      example: 429,
    }),
    status: z.string().openapi({
      description: "The error status",
      example: "error",
    }),
  }),
}).openapi("RateLimitError", {
  description: "Rate limit exceeded error response",
});
