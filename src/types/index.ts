import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { FormOption } from "./request-types.js";
import type { forms_v1 } from "@googleapis/forms";

/**
 * Utility type to infer parameter types from Zod schema
 */
export type InferZodParams<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

/**
 * Interface for MCP tools
 */
export interface IMCPTool<TParams extends Record<string, z.ZodType> = Record<string, z.ZodType>> {
  /**
   * Tool name
   */
  readonly name: string;

  /**
   * Tool description
   */
  readonly description: string;

  /**
   * Parameter definitions
   */
  readonly parameters: TParams;

  /**
   * Execute the tool
   * @param args Parameters
   * @returns Execution result
   */
  execute(args: InferZodParams<TParams>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }>;
}

/**
 * Form ID schema definition
 */
export const FormIdSchema = z.string().min(1);

/**
 * Form URL schema definition
 */
export const FormUrlSchema = z.string().url();

/**
 * Form item type
 */
export type ItemType = "text" | "question" | "pageBreak" | "questionGroup";

/**
 * Zod schema for form item type
 */
export const ItemTypeSchema = z
  .enum(["text", "question", "pageBreak", "questionGroup"])
  .describe("Type of item to create");

/**
 * Question type
 */
export type QuestionType = "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";

/**
 * Zod schema for question type
 */
export const QuestionTypeSchema = z
  .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
  .describe("Type of question");

/**
 * Go To Action type for branching
 */
export type GoToActionType = "NEXT_SECTION" | "RESTART_FORM" | "SUBMIT_FORM";

/**
 * Zod schema for Go To Action type
 */
export const GoToActionSchema = z
  .enum(["NEXT_SECTION", "RESTART_FORM", "SUBMIT_FORM"])
  .describe("Type of branching action");

/**
 * Option with branching capability schema
 */
export const FormOptionSchema = z.object({
  value: z.string().describe("Option text value"),
  goToAction: GoToActionSchema.optional().describe("Branching action to take when this option is selected"),
  goToSectionId: z.string().optional().describe("Section ID to navigate to when this option is selected")
}).describe("Form option with optional branching capability");

/**
 * Operation type
 */
export type OperationType =
  | "create_item"
  | "update_item"
  | "delete_item"
  | "move_item"
  | "update_form_info";

/**
 * Zod schema for operation type
 */
export const OperationTypeSchema = z
  .enum(["create_item", "update_item", "delete_item", "move_item", "update_form_info"])
  .describe("Type of operation to execute");

/**
 * Batch update operation type definition
 */
export type BatchUpdateOperation = {
  operation: OperationType;
  index?: number;
  title?: string;
  description?: string;
  item_type?: ItemType;
  question_type?: QuestionType;
  options?: FormOption[];
  required?: boolean;
  include_other?: boolean;
  new_index?: number;

  updateItemRequest?: {
    item: forms_v1.Schema$Item;
    update_mask: string;
  };
};
