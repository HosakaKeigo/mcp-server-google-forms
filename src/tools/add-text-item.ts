import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to add a text item to a form
 */
export class AddTextItemTool {
  /**
   * Tool name
   */
  readonly name = "add_text_item";

  /**
   * Tool description
   */
  readonly description = "Add a text item (item with only title and description) to a Google Form.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("Item title"),
    description: z.string().optional().describe("Item description (optional)"),
    index: z.number().optional().describe("Insertion position (appends to the end if omitted)"),
  };

  /**
   * Execute the tool
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
      const result = await service.addTextItem(formId, args.title, args.description, args.index);

      return {
        content: [
          {
            type: "text",
            text: `Added text item "${args.title}" to the form. Current form items are:

            ${JSON.stringify(result.form?.items, null, 2)}`,
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
