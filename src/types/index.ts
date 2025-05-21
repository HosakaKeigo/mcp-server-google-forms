import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  BatchOperationSchema,
  FormOptionSchema,
  GoToActionSchema,
  ItemTypeSchema,
  QuestionTypeSchema,
} from "./schemas.js";

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
 * Interface for MCP prompts
 */
export interface IMCPPrompt<
  TParams extends Record<string, z.ZodType> = Record<string, z.ZodType>,
> {
  /**
   * Prompt name
   */
  readonly name: string;

  /**
   * Parameter definitions
   */
  readonly schema: TParams;

  /**
   * Prompt handler
   */
  handler(args: InferZodParams<TParams>): {
    messages: {
      role: "user" | "assistant";
      content: TextContent;
    }[];
  };
}

export type FormOption = z.infer<typeof FormOptionSchema>;
export type BatchUpdateOperation = z.infer<typeof BatchOperationSchema>;
