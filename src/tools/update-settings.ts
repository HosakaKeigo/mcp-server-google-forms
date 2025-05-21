import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema, type InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * MCP tool to update form settings
 */
export class UpdateSettingsTool {
  /**
   * Tool name
   */
  readonly name = "update_settings";

  /**
   * Tool description
   */
  readonly description =
    "Updates Google Forms settings. You can change email collection settings, quiz settings, etc.";

  /**
   * Tool parameters definition
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    email_collection_type: z
      .enum(["DO_NOT_COLLECT", "VERIFIED", "RESPONDER_INPUT"])
      .optional()
      .describe(
        "Email collection type (DO_NOT_COLLECT: do not collect, VERIFIED: verified email, RESPONDER_INPUT: email input by respondent)",
      ),
    is_quiz: z.boolean().optional().describe("Whether it's in quiz format"),
    release_grade: z
      .enum(["NONE", "IMMEDIATELY", "LATER"])
      .optional()
      .describe("Grade release method (NONE: do not publish, IMMEDIATELY: immediate, LATER: later)"),
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

      // Create settings object and update_mask
      const settings: {
        emailCollectionType?: string;
        quizSettings?: {
          isQuiz?: boolean;
          releaseGrade?: string;
        };
      } = {};

      const updateMaskParts: string[] = [];

      // Email collection settings
      if (args.email_collection_type !== undefined) {
        settings.emailCollectionType = args.email_collection_type;
        updateMaskParts.push("emailCollectionType");
      }

      // Quiz settings processing
      if (args.is_quiz !== undefined || args.release_grade !== undefined) {
        settings.quizSettings = {};

        if (args.is_quiz !== undefined) {
          settings.quizSettings.isQuiz = args.is_quiz;
          updateMaskParts.push("quizSettings.isQuiz");
        }

        if (args.release_grade !== undefined) {
          settings.quizSettings.releaseGrade = args.release_grade;
          updateMaskParts.push("quizSettings.releaseGrade");
        }
      }

      // Error if no items to update
      if (updateMaskParts.length === 0) {
        throw new Error("Please specify at least one setting item to update");
      }

      // Update settings
      const result = await service.updateSettings(formId, settings, updateMaskParts.join(","));

      // Generate description of settings changes
      const changes: string[] = [];

      if (settings.emailCollectionType) {
        const emailCollectionTypeMap = {
          EMAIL_COLLECTION_TYPE_UNSPECIFIED: "Unspecified",
          DO_NOT_COLLECT: "Do not collect",
          VERIFIED: "Verified email",
          RESPONDER_INPUT: "Email input by respondent",
        };
        changes.push(
          `Email collection: ${emailCollectionTypeMap[settings.emailCollectionType as keyof typeof emailCollectionTypeMap]}`,
        );
      }

      if (settings.quizSettings?.isQuiz !== undefined) {
        changes.push(`Quiz format: ${settings.quizSettings.isQuiz ? "Enabled" : "Disabled"}`);
      }

      if (settings.quizSettings?.releaseGrade) {
        const releaseGradeMap = {
          NONE: "Do not publish",
          IMMEDIATELY: "Immediate",
          LATER: "Later",
        };
        changes.push(
          `Grade release: ${releaseGradeMap[settings.quizSettings.releaseGrade as keyof typeof releaseGradeMap]}`,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: `Form settings updated.\nChanges: ${changes.join(", ")}\n\nUpdated form information:\n${JSON.stringify(result.form, null, 2)}`,
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
