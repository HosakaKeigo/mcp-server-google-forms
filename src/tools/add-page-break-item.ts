import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to add a page break to a form
 */
export class AddPageBreakItemTool {
  /**
   * Tool name
   */
  readonly name = "add_page_break_item";

  /**
   * Tool description
   */
  readonly description = "Add a new page break to Google Forms.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("Page break title (displayed at the beginning of the new page)"),
    description: z.string().optional().describe("Page break description (optional)"),
    index: z.number().int().min(0).optional().describe("Insertion position (appends to the end if omitted)"),
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

      // Get form information (to verify index)
      const form = await service.getForm(formId);

      // Check range if index is specified
      if (args.index !== undefined) {
        const maxIndex = form.items ? form.items.length : 0;
        if (args.index < 0 || args.index > maxIndex) {
          throw new Error(
            `Index ${args.index} is out of range. The form has ${maxIndex} items. Valid range is 0-${maxIndex}.`,
          );
        }
      }

      // Add page break
      const result = await service.addPageBreakItem(
        formId,
        args.title,
        args.description,
        args.index,
      );
      return {
        content: [
          {
            type: "text",
            text: `Added a new page break to the form.\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
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
