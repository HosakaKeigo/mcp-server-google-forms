import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to move form items
 */
export class MoveItemTool {
  /**
   * Tool name
   */
  readonly name = "move_item";

  /**
   * Tool description
   */
  readonly description = "Moves items to different positions within Google Forms.";

  /**
   * Tool parameters definition
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    original_index: z
      .number()
      .int()
      .min(0)
      .describe("Current index of the item to move (0-based)"),
    new_index: z.number().int().min(0).describe("Destination index where to move the item (0-based)"),
  };

  /**
   * Tool execution
   * @param args Tool arguments
   * @returns Tool execution result
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // Extract form ID
      const formId = extractFormId(args.form_url);

      // Check if indices are within range (strict check is done on API side)
      if (args.original_index < 0 || args.new_index < 0) {
        throw new Error("Indices must be 0 or greater");
      }

      // Check for move to the same position
      if (args.original_index === args.new_index) {
        return {
          content: [
            {
              type: "text",
              text: `Item is already at index ${args.original_index}. No move needed.`,
            },
          ],
        };
      }

      // Initialize the service
      const service = new GFormService();

      // Move the item
      const result = await service.moveItem(formId, args.original_index, args.new_index);

      return {
        content: [
          {
            type: "text",
            text: `Item moved from index ${args.original_index} to ${args.new_index}.\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
