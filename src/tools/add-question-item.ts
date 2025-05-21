import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to add a question item to a form
 */
export class AddQuestionItemTool {
  /**
   * Tool name
   */
  readonly name = "add_question_item";

  /**
   * Tool description
   */
  readonly description =
    "Add a question item to Google Forms. You can create text or multiple-choice questions.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("Question title"),
    question_type: z
      .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
      .describe(
        "Question type (TEXT: short text, PARAGRAPH_TEXT: long text, RADIO: radio buttons, CHECKBOX: checkboxes, DROP_DOWN: dropdown)",
      ),
    options: z.array(z.string()).optional().describe("Options (for RADIO, CHECKBOX, DROP_DOWN)"),
    required: z.boolean().optional().default(false).describe("Whether the question is required (defaults to false)"),
    include_other: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to include an 'Other' option (only valid for RADIO and CHECKBOX, defaults to false)",
      ),
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

      // For multiple-choice questions, options are required
      if (
        (args.question_type === "RADIO" ||
          args.question_type === "CHECKBOX" ||
          args.question_type === "DROP_DOWN") &&
        (!args.options || args.options.length === 0)
      ) {
        throw new Error(`Questions of type ${args.question_type} require options`);
      }

      // Initialize service
      const service = new GFormService();

      // Add question item
      await service.addQuestionItem(
        formId,
        args.title,
        args.question_type,
        args.options,
        args.required,
        args.include_other,
        args.index,
      );

      // Convert question type to display name
      const questionTypeMap = {
        TEXT: "Short text",
        PARAGRAPH_TEXT: "Paragraph text",
        RADIO: "Radio buttons",
        CHECKBOX: "Checkboxes",
        DROP_DOWN: "Dropdown",
      };

      return {
        content: [
          {
            type: "text",
            text: `Added question item "${args.title}" (${questionTypeMap[args.question_type]}) to the form. ${
              args.required ? "(Required)" : ""
            }${
              args.include_other &&
              (args.question_type === "RADIO" || args.question_type === "CHECKBOX")
                ? "(With 'Other' option)"
                : ""
            }`,
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
