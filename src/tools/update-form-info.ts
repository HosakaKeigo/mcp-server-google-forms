import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to update form information
 */
export class UpdateFormInfoTool {
  /**
   * Tool name
   */
  readonly name = "update_form_info";

  /**
   * Tool description
   */
  readonly description = "Updates basic Google Forms information (title and description).";

  /**
   * Tool parameters definition
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().optional().describe("New form title (optional)"),
    description: z.string().optional().describe("New form description (optional)"),
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
      // Check if at least one parameter is provided
      if (args.title === undefined && args.description === undefined) {
        throw new Error("Please specify at least one item to update (title or description)");
      }

      // Extract form ID
      const formId = extractFormId(args.form_url);

      // Initialize the service
      const service = new GFormService();

      // Update form information
      const result = await service.updateFormInfo(formId, args.title, args.description);

      // Create update message
      let message = "Form information updated: ";
      const updates: string[] = [];

      if (args.title !== undefined) {
        updates.push(`Title "${args.title}"`);
      }

      if (args.description !== undefined) {
        updates.push(`Description "${args.description}"`);
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
