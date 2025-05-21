import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to get form information
 */
export class GetFormTool {
  /**
   * Tool name
   */
  readonly name = "get_form";

  /**
   * Tool description
   */
  readonly description =
    "Retrieve the structure of a Google Form. Use this as preparation for editing.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
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

      // Get form information
      const form = new GFormService();
      const formData = await form.getForm(formId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formData, null, 2),
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
