import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";

/**
 * MCP tool to create a new Google Form
 */
export class CreateFormTool {
  /**
   * Tool name
   */
  readonly name = "create_form";

  /**
   * Tool description
   */
  readonly description = "Creates a new Google Form. You can only specify the title.";

  /**
   * Tool parameters definition
   */
  readonly parameters = {
    title: z.string().describe("Form title"),
    document_title: z
      .string()
      .optional()
      .describe("Document title (if omitted, same as the form title)"),
    unpublished: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to unpublish the form (if true, does not accept responses, default is false)",
      ),
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
      // Initialize the service
      const service = new GFormService();

      // Create the form
      const result = await service.createForm(args.title, args.document_title, args.unpublished);

      // Create the form URL
      let formUrl = "";
      if (result.formId) {
        formUrl = `https://docs.google.com/forms/d/e/${result.formId}/edit`;
      }

      return {
        content: [
          {
            type: "text",
            text: `Form created successfully.\nTitle: ${args.title}\nForm ID: ${result.formId}\nURL: ${formUrl}`,
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
