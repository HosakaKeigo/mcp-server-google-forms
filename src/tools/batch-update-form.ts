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

          createItemRequest: z.object({
            title: z.string().describe("Item title"),
            description: z.string().optional().describe("Item description"),
            index: z.number().optional().describe("Insertion position (appends to the end if omitted)"),
            item_type: ItemTypeSchema.describe("Type of item to create"),
            question_type: QuestionTypeSchema.optional().describe("Type of question (required when creating question items)"),
            options: z.array(FormOptionSchema).optional().describe("List of options with optional branching logic"),
            required: z.boolean().optional().describe("Whether the question is required"),
            include_other: z.boolean().optional().describe("Whether to include an 'Other' option"),
            // For question_group only
            rows: z.array(
              z.object({
                title: z.string().describe("Row title"),
                required: z.boolean().optional().describe("Whether this row is required")
              })
            ).optional().describe("Rows for question groups"),
            isGrid: z.boolean().optional().describe("Whether this is a grid-style question group"),
            columns: z.array(FormOptionSchema).optional().describe("Columns for grid-style question groups"),
            gridType: z.enum(["CHECKBOX", "RADIO"]).optional().describe("Selection type for grid questions"),
            shuffleQuestions: z.boolean().optional().describe("Whether to shuffle questions in the group")
          }).optional().describe("Request object for creating an item"),

          updateItemRequest: z.object({
            item: z.any().describe("Full item object after update"),
            index: z.number().describe("Index of the item to update"),
            update_mask: z.string().describe(`A comma-separated list of fully qualified names of fields. Example: "user.displayName,photo"`),
          }).optional().describe("Request object for updating an item"),

          deleteItemRequest: z.object({
            index: z.number().describe("Index of the item to delete")
          }).optional().describe("Request object for deleting an item"),

          moveItemRequest: z.object({
            index: z.number().describe("Original index of the item to move"),
            new_index: z.number().describe("Destination index for the item")
          }).optional().describe("Request object for moving an item"),

          updateFormInfoRequest: z.object({
            title: z.string().optional().describe("New form title"),
            description: z.string().optional().describe("New form description")
          }).optional().describe("Request object for updating form information"),
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
              if (!op.createItemRequest) {
                throw new Error(`Operation #${opIndex + 1}: createItemRequest is required when creating an item`);
              }
              request = buildCreateItemRequest({
                title: op.createItemRequest.title,
                description: op.createItemRequest.description,
                index: op.createItemRequest.index,
                itemType: op.createItemRequest.item_type,
                questionType: op.createItemRequest.question_type,
                options: op.createItemRequest.options,
                required: op.createItemRequest.required,
                includeOther: op.createItemRequest.include_other,
                rows: op.createItemRequest.rows,
                isGrid: op.createItemRequest.isGrid,
                columns: op.createItemRequest.columns,
                gridType: op.createItemRequest.gridType,
                shuffleQuestions: op.createItemRequest.shuffleQuestions,
              });
              break;
            }
            case "update_item": {
              if (op.updateItemRequest) {
                // op.index から取得
                const itemIndex = op.updateItemRequest.index;

                if (itemIndex === undefined) {
                  throw new Error(`Operation #${opIndex + 1}: index is required when updating an item`);
                }

                if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                  throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
                }

                if (!op.updateItemRequest.item) {
                  throw new Error(`Operation #${opIndex + 1}: 'item' is required in updateItemRequest`);
                }

                if (!op.updateItemRequest.update_mask) {
                  throw new Error(`Operation #${opIndex + 1}: 'update_mask' is required in updateItemRequest`);
                }

                request = buildUpdateItemRequest({
                  item: op.updateItemRequest.item,
                  location: { index: itemIndex },
                  updateMask: op.updateItemRequest.update_mask,
                });
              } else {
                // 従来の形式はサポートしなくなったので、エラーを返す
                throw new Error(`Operation #${opIndex + 1}: updateItemRequest is required for update_item operations`);
              }
              break;
            }
            case "delete_item": {
              if (!op.deleteItemRequest) {
                throw new Error(`Operation #${opIndex + 1}: deleteItemRequest is required when deleting an item`);
              }
              const itemIndex = op.deleteItemRequest.index;
              if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
              }
              request = buildDeleteItemRequest({ index: itemIndex });
              break;
            }
            case "move_item": {
              if (!op.moveItemRequest) {
                throw new Error(`Operation #${opIndex + 1}: moveItemRequest is required when moving an item`);
              }
              const itemIndex = op.moveItemRequest.index;
              const newIndex = op.moveItemRequest.new_index;

              if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
              }
              if (newIndex < 0 || newIndex > form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: New index ${newIndex} is out of range`);
              }
              request = buildMoveItemRequest({ index: itemIndex, newIndex: newIndex });
              break;
            }
            case "update_form_info": {
              if (!op.updateFormInfoRequest) {
                throw new Error(`Operation #${opIndex + 1}: updateFormInfoRequest is required when updating form info`);
              }
              request = buildUpdateFormInfoRequest({
                title: op.updateFormInfoRequest.title,
                description: op.updateFormInfoRequest.description,
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
      case "create_item": {
        if (!op.createItemRequest) {
          throw new Error("createItemRequest is required");
        }
        const req = op.createItemRequest;
        return `Create item: type=${req.item_type}, title="${req.title}"${req.index !== undefined ? `, position=${req.index}` : ""
          }${req.options
            ? `, options=[${req.options
              .map((o) => {
                let desc = `"${o.value}"`;
                if (o.goToAction) desc += ` (→${o.goToAction})`;
                else if (o.goToSectionId) desc += ` (→Section:${o.goToSectionId})`;
                return desc;
              })
              .join(", ")}]`
            : ""
          }`;
      }

      case "update_item": {
        return `Update item: index=${op.updateItemRequest?.index}, fields: ${op.updateItemRequest?.update_mask}`;
      }

      case "delete_item": {
        return `Delete item: index=${op.deleteItemRequest?.index}`;
      }

      case "move_item": {
        return `Move item: index=${op.moveItemRequest?.index} → ${op.moveItemRequest?.new_index}`;
      }

      case "update_form_info": {
        const updates: string[] = [];
        if (op.updateFormInfoRequest?.title !== undefined) {
          updates.push(`title="${op.updateFormInfoRequest.title}"`);
        }
        if (op.updateFormInfoRequest?.description !== undefined) {
          updates.push(`description="${op.updateFormInfoRequest.description}"`);
        }
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
