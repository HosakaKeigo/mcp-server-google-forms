import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to delete form items
 */
export class DeleteItemTool {
  /**
   * Tool name
   */
  readonly name = "delete_item";

  /**
   * Tool description
   */
  readonly description = "Deletes items from Google Forms.";

  /**
   * Tool parameters definition
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    index: z.number().int().min(0).describe("Index of the item to delete (0-based)"),
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

      // Initialize the service
      const service = new GFormService();

      // Get form information (to verify index)
      const form = await service.getForm(formId);

      // Validate index range
      if (args.index < 0 || !form.items || args.index >= form.items.length) {
        throw new Error(
          `Index ${args.index} is out of range. The form has ${form.items ? form.items.length : 0} items.`,
        );
      }

      // Get information about the item to be deleted
      const itemToDelete = form.items[args.index];

      // Delete the item
      const result = await service.deleteItem(formId, args.index);

      return {
        content: [
          {
            type: "text",
            text: `Deleted item "${itemToDelete.title || "Untitled"}" at index ${args.index}.\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
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
