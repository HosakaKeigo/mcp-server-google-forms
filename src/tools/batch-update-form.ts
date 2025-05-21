import type { forms_v1 } from "@googleapis/forms";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  type BatchUpdateOperation,
  FormOptionSchema,
  FormUrlSchema,
  type InferZodParams,
  ItemTypeSchema,
  OperationTypeSchema,
  QuestionTypeSchema,
} from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import {
  buildCreateItemRequest,
  buildDeleteItemRequest,
  buildMoveItemRequest,
  buildUpdateFormInfoRequest,
  buildUpdateItemRequest,
} from "../utils/request-builders.js";

/**
 * MCP tool to batch update multiple items in a form
 */
export class BatchUpdateFormTool {
  /**
   * Tool name
   */
  readonly name = "batch_update_form";

  /**
   * Tool description
   */
  readonly description =
    "Execute multiple update operations on Google Forms in a single batch. You can add, update, delete, and move items all at once. Use this tool preferentially as it's more efficient.";

  /**
   * Tool parameter definitions
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    operations: z
      .array(
        z.object({
          // Operation type
          operation: OperationTypeSchema,

          // Common parameters
          index: z.number().optional().describe("Index of the target item (when needed)"),

          // Parameters for creating and updating items
          title: z.string().optional().describe("Item title"),
          description: z.string().optional().describe("Item description"),

          // Item type information (for create_item)
          item_type: ItemTypeSchema.optional(),

          // Question type information (when creating questions)
          question_type: QuestionTypeSchema.optional(),
          options: z.array(FormOptionSchema).optional().describe("List of options with optional branching logic (for multiple-choice questions)"),
          required: z.boolean().optional().describe("Whether the question is required"),
          include_other: z
            .boolean()
            .optional()
            .describe("Whether to include an 'Other' option (for multiple-choice questions)"),

          // Parameters for moving items
          new_index: z.number().optional().describe("Destination index (required when using move_item)"),
        }),
      )
      .describe("List of operations to execute"),
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

      // Get form information (for index validation, etc.)
      const form = await service.getForm(formId);
      if (!form) {
        throw new Error("Form not found.");
      }

      // Prepare requests
      const requests: forms_v1.Schema$Request[] = [];
      // Sort create_item operations because they are processed in reverse order
      const processedOps = sortBatchOperations(args.operations);

      // Convert each operation to a request
      for (const [opIndex, op] of processedOps.entries()) {
        try {
          let request: forms_v1.Schema$Request | Error | undefined;
          switch (op.operation) {
            case "create_item": {
              if (!op.item_type) {
                throw new Error(`Operation #${opIndex + 1}: item_type is required when creating an item`);
              }
              if (!op.title) {
                throw new Error(`Operation #${opIndex + 1}: title is required when creating an item`);
              }
              request = buildCreateItemRequest({
                title: op.title,
                description: op.description,
                index: op.index,
                itemType: op.item_type,
                questionType: op.question_type,
                options: op.options,
                required: op.required,
                includeOther: op.include_other,
              });
              break;
            }
            case "update_item": {
              if (op.index === undefined) {
                throw new Error(`Operation #${opIndex + 1}: index is required when updating an item`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${op.index} is out of range`);
              }
              const currentItem = form.items[op.index];
              request = buildUpdateItemRequest(
                {
                  index: op.index,
                  title: op.title,
                  description: op.description,
                  required: op.required,
                },
                currentItem,
              );
              break;
            }
            case "delete_item": {
              if (op.index === undefined) {
                throw new Error(`Operation #${opIndex + 1}: index is required when deleting an item`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${op.index} is out of range`);
              }
              request = buildDeleteItemRequest({ index: op.index });
              break;
            }
            case "move_item": {
              if (op.index === undefined) {
                throw new Error(`Operation #${opIndex + 1}: index is required when moving an item`);
              }
              if (op.new_index === undefined) {
                throw new Error(`Operation #${opIndex + 1}: new_index is required when moving an item`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${op.index} is out of range`);
              }
              if (op.new_index < 0 || op.new_index > form.items.length) {
                throw new Error(
                  `Operation #${opIndex + 1}: New index ${op.new_index} is out of range`,
                );
              }
              request = buildMoveItemRequest({ index: op.index, newIndex: op.new_index });
              break;
            }
            case "update_form_info": {
              request = buildUpdateFormInfoRequest({
                title: op.title,
                description: op.description,
              });
              break;
            }
            default:
              throw new Error(`Operation #${opIndex + 1}: Unknown operation type: ${op.operation}`);
          }
          if (request instanceof Error) {
            throw new Error(`Operation #${opIndex + 1}: ${request.message}`);
          }
          requests.push(request);
        } catch (error) {
          throw new Error(
            `Error occurred in operation #${opIndex + 1}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Error if there are no requests
      if (requests.length === 0) {
        throw new Error("No operations to execute");
      }

      // Execute batch update
      const result = await service.batchUpdateForm(formId, requests);

      return {
        content: [
          {
            type: "text",
            text: `Executed ${requests.length} operations in batch.

Operations:
${args.operations.map((op, i) => `${i + 1}. ${this.formatOperation(op)}`).join("\n")}

The form now has ${result.form?.items?.length ?? 0} items.

Updated form information:
${JSON.stringify(result.form, null, 2)}`,
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

  /**
   * Format operation details in a human-readable format
   * @param op Operation object
   * @returns Formatted description of the operation
   */
  private formatOperation(op: BatchUpdateOperation): string {
    switch (op.operation) {
      case "create_item":
        return `Create item: type=${op.item_type}, title="${op.title}"${op.index !== undefined ? `, position=${op.index}` : ""}${op.options
          ? `, options=[${op.options
            .map((o) => {
              let desc = `"${o.value}"`;
              if (o.goToAction) desc += ` (→${o.goToAction})`;
              else if (o.goToSectionId) desc += ` (→Section:${o.goToSectionId})`;
              return desc;
            })
            .join(", ")}]`
          : ""
          }`;

      case "update_item": {
        const updates: string[] = [];
        if (op.title !== undefined) updates.push(`title="${op.title}"`);
        if (op.description !== undefined) updates.push(`description="${op.description}"`);
        if (op.required !== undefined) updates.push(`required=${op.required}`);
        return `Update item: index=${op.index}, changes: ${updates.join(", ")}`;
      }

      case "delete_item":
        return `Delete item: index=${op.index}`;

      case "move_item":
        return `Move item: index=${op.index} → ${op.new_index}`;

      case "update_form_info": {
        const updates: string[] = [];
        if (op.title !== undefined) updates.push(`title="${op.title}"`);
        if (op.description !== undefined) updates.push(`description="${op.description}"`);
        return `Update form info: ${updates.join(", ")}`;
      }

      default:
        return `Unknown operation: ${op.operation}`;
    }
  }
}

/**
 * Sort the list of operations for batch update
 * Reverse the create_item operations because they are processed in reverse order
 */
function sortBatchOperations(operations: BatchUpdateOperation[]) {
  const createOps = operations.filter((op) => op.operation === "create_item");
  const otherOps = operations.filter((op) => op.operation !== "create_item");
  const reversedCreateOps = [...createOps].reverse();
  return [...reversedCreateOps, ...otherOps];
}
