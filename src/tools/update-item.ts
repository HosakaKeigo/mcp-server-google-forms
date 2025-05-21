import type { forms_v1 } from "@googleapis/forms";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to update a form item
 */
export class UpdateItemTool {
  /**
   * Tool name
   */
  readonly name = "update_item";

  /**
   * Tool description
   */
  readonly description =
    "Update an existing item in Google Forms. You can change the item title, description, required settings for questions, etc.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    index: z.number().int().min(0).describe("Index of the item to update (starting from 0)"),
    title: z.string().optional().describe("New title for the item (optional)"),
    description: z.string().optional().describe("New description for the item (optional)"),
    required: z
      .boolean()
      .optional()
      .describe("Required setting for question items (optional, only valid for question items)"),
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

      // Initialize service
      const service = new GFormService();

      // Get form information (to verify index and retrieve current item information)
      const form = await service.getForm(formId);

      // Check index range
      if (args.index < 0 || !form.items || args.index >= form.items.length) {
        throw new Error(
          `Index ${args.index} is out of range. The form has ${form.items ? form.items.length : 0} items.`,
        );
      }

      // Retrieve current item information
      const currentItem = form.items[args.index];

      // Create update object and update_mask
      const item: forms_v1.Schema$Item = {};
      const updateMaskParts: string[] = [];

      // Update title
      if (args.title !== undefined) {
        item.title = args.title;
        updateMaskParts.push("title");
      }

      // Update description
      if (args.description !== undefined) {
        item.description = args.description;
        updateMaskParts.push("description");
      }

      // Update required setting (only for question items)
      if (args.required !== undefined) {
        // Check if it's a question item
        if (currentItem.questionItem) {
          if (!item.questionItem) {
            item.questionItem = {
              question: {},
            };
          }
          if (!item.questionItem.question) {
            item.questionItem.question = {};
          }
          item.questionItem.question.required = args.required;
          updateMaskParts.push("questionItem.question.required");
        } else {
          throw new Error("The 'required' parameter can only be applied to question items (questionItem)");
        }
      }

      // Error if no items to update
      if (updateMaskParts.length === 0) {
        throw new Error("Please specify at least one field to update");
      }

      // Update the item
      const result = await service.updateItem(formId, args.index, item);

      // Create message with update details
      let message = `Updated item at index ${args.index}: `;
      const updates: string[] = [];

      if (args.title !== undefined) {
        updates.push(`Title "${args.title}"`);
      }

      if (args.description !== undefined) {
        updates.push(`Description "${args.description}"`);
      }

      if (args.required !== undefined) {
        updates.push(`Required setting: ${args.required ? "enabled" : "disabled"}`);
      }

      message += updates.join(", ");

      return {
        content: [
          {
            type: "text",
            text: `${message}\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
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
