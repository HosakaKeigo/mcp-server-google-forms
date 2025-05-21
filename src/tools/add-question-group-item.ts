import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to add a question group (grid) to a form
 */
export class AddQuestionGroupItemTool {
  /**
   * Tool name
   */
  readonly name = "add_question_group_item";

  /**
   * Tool description
   */
  readonly description =
    "Add a question group to Google Forms (multiple questions grouped into one section, also supports grid format).";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("Question group title"),
    rows: z
      .array(
        z.object({
          title: z.string().describe("Question (row) title"),
          required: z.boolean().optional().describe("Whether required (defaults to false if omitted)"),
        }),
      )
      .min(1)
      .describe("List of questions (rows)"),
    is_grid: z.boolean().default(false).describe("Whether grid format (defaults to false if omitted)"),
    grid_type: z
      .enum(["CHECKBOX", "RADIO"])
      .optional()
      .describe("Selection type for grid format (checkbox or radio button)"),
    columns: z.array(z.string()).optional().describe("Columns (options) for grid format"),
    shuffle_questions: z
      .boolean()
      .optional()
      .describe("Whether to shuffle questions randomly (defaults to false if omitted)"),
    description: z.string().optional().describe("Question group description (optional)"),
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

      // Grid format validation
      if (args.is_grid) {
        if (!args.columns || args.columns.length === 0) {
          throw new Error("Columns (options) are required for grid format question groups");
        }
        if (!args.grid_type) {
          throw new Error(
            "Selection type (CHECKBOX or RADIO) is required for grid format question groups",
          );
        }
      }

      // Add question group
      const result = await service.addQuestionGroupItem(
        formId,
        args.title,
        args.rows,
        args.is_grid,
        args.columns,
        args.grid_type,
        args.shuffle_questions,
        args.description,
        args.index,
      );

      const gridText = args.is_grid
        ? `Grid format (${args.grid_type === "CHECKBOX" ? "Checkbox" : "Radio button"})`
        : "Standard format";

      return {
        content: [
          {
            type: "text",
            text:
              `Added question group "${args.title}" to the form.` +
              `\n- Format: ${gridText}` +
              `\n- Number of questions: ${args.rows.length}` +
              `\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
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
