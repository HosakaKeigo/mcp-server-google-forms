import type z from "zod";
import type {
  CreateItemRequestSchema,
  UpdateItemRequestSchema,
  DeleteItemRequestSchema,
  MoveItemRequestSchema,
  UpdateFormInfoRequestSchema,
  UpdateFormSettingsRequestSchema
} from "./schemas.js";

// Parameter type definitions for Google Forms requests
export type CreateItemRequestParams = z.infer<typeof CreateItemRequestSchema>;
export type UpdateItemRequestParams = z.infer<typeof UpdateItemRequestSchema>;
export type DeleteItemRequestParams = z.infer<typeof DeleteItemRequestSchema>;
export type MoveItemRequestParams = z.infer<typeof MoveItemRequestSchema>;
export type UpdateFormInfoRequestParams = z.infer<typeof UpdateFormInfoRequestSchema>;
export type UpdateFormSettingsRequestParams = z.infer<typeof UpdateFormSettingsRequestSchema>;
