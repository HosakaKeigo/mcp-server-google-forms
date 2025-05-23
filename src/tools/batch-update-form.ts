import type { forms_v1 } from "@googleapis/forms";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import {
  buildCreateItemRequest,
  buildDeleteItemRequest,
  buildMoveItemRequest,
  buildUpdateFormInfoRequest,
  buildUpdateFormSettingsRequest,
  buildUpdateItemRequest,
} from "../utils/request-builders.js";
import { BatchUpdateFormSchema, SUPPORTED_OPERATIONS } from "../types/schemas.js";
import type { BatchUpdateOperation, InferZodParams } from "../types/index.js";

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
    `Execute multiple update operations on Google Forms in a single batch. You can add, update, delete, and move items all at once. Supported operations: ${SUPPORTED_OPERATIONS.join(", ")}
[Note]: 
- If you want to provide created form url, use the url ending with "/viewform" instead of "/edit".
- If you want to create a quiz form, first use the "update_form_settings" operation to set the form to quiz mode, and then use the "create_item" operation to add quiz items. You cannot set the form to quiz mode and create quiz items in the same request.`;

  /**
   * Tool parameter definitions
   */
  readonly parameters = BatchUpdateFormSchema.shape;

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
              request = buildCreateItemRequest(op.createItemRequest);
              break;
            }
            case "update_item": {
              const itemIndex = op.updateItemRequest.index;

              if (itemIndex === undefined) {
                throw new Error(
                  `Operation #${opIndex + 1}: index is required when updating an item`,
                );
              }

              if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
              }

              if (!op.updateItemRequest.item) {
                throw new Error(
                  `Operation #${opIndex + 1}: 'item' is required in updateItemRequest`,
                );
              }

              if (!op.updateItemRequest.update_mask) {
                throw new Error(
                  `Operation #${opIndex + 1}: 'update_mask' is required in updateItemRequest`,
                );
              }

              request = buildUpdateItemRequest(op.updateItemRequest);
              break;
            }
            case "delete_item": {
              const itemIndex = op.deleteItemRequest.index;
              if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
              }
              request = buildDeleteItemRequest(op.deleteItemRequest);
              break;
            }
            case "move_item": {
              const itemIndex = op.moveItemRequest.index;
              const newIndex = op.moveItemRequest.new_index;

              if (itemIndex < 0 || !form.items || itemIndex >= form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: Index ${itemIndex} is out of range`);
              }
              if (newIndex < 0 || newIndex > form.items.length) {
                throw new Error(`Operation #${opIndex + 1}: New index ${newIndex} is out of range`);
              }
              request = buildMoveItemRequest(op.moveItemRequest);
              break;
            }
            case "update_form_info": {
              request = buildUpdateFormInfoRequest(op.updateFormInfoRequest);
              break;
            }
            case "update_form_settings": {
              request = buildUpdateFormSettingsRequest(op.updateFormSettingsRequest);
              break;
            }
            default:
              throw new Error(`Operation #${opIndex + 1}: Unknown operation type`);
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
        const req = op.createItemRequest;
        let description = `Create item: type=${req.item_type}, title="${req.title}"${req.index !== undefined ? `, position=${req.index}` : ""
          }`;

        switch (req.item_type) {
          case "question": {
            if (req.options) {
              description += `, options=[${req.options
                .map((o) => {
                  let desc = `"${o.value}"`;
                  if (o.goToAction) desc += ` (→${o.goToAction})`;
                  else if (o.goToSectionId) desc += ` (→Section:${o.goToSectionId})`;
                  return desc;
                })
                .join(", ")}]`;
            }

            if (req.grading) {
              description += `, points=${req.grading.pointValue}`;
              if (req.grading.correctAnswers) {
                description += `, correct answers=[${req.grading.correctAnswers.answers.map((a) => `"${a.value}"`).join(", ")}]`;
              }
            }

            if (req.question_type) {
              description += `, question_type=${req.question_type}`;
            }
            break;
          }
          case "questionGroup": {
            if (req.question_group_params) {
              const params = req.question_group_params;
              if (params.rows) {
                description += `, rows=${params.rows.length}`;
              }
              if (params.is_grid) {
                description += ", grid=true";
              }
            }
            break;
          }
          case "image": {
            if (req.imageItem?.image?.sourceUri) {
              description += `, source=${req.imageItem.image.sourceUri}`;
            }
            break;
          }
          case "video": {
            if (req.videoItem?.video?.youtubeUri) {
              description += `, youtube=${req.videoItem.video.youtubeUri}`;
            }
            break;
          }
          // text and pageBreak don't need additional info
        }

        return description;
      }

      case "update_item": {
        return `Update item: index=${op.updateItemRequest.index}, fields: ${op.updateItemRequest.update_mask}`;
      }

      case "delete_item": {
        return `Delete item: index=${op.deleteItemRequest.index}`;
      }

      case "move_item": {
        return `Move item: index=${op.moveItemRequest.index} → ${op.moveItemRequest.new_index}`;
      }

      case "update_form_info": {
        const updates: string[] = [];
        if (op.updateFormInfoRequest.title !== undefined) {
          updates.push(`title="${op.updateFormInfoRequest.title}"`);
        }
        if (op.updateFormInfoRequest.description !== undefined) {
          updates.push(`description="${op.updateFormInfoRequest.description}"`);
        }
        return `Update form info: ${updates.join(", ")}`;
      }

      case "update_form_settings": {
        const updates: string[] = [];
        if (op.updateFormSettingsRequest.email_collection_type !== undefined) {
          updates.push(`email collection="${op.updateFormSettingsRequest.email_collection_type}"`);
        }
        if (op.updateFormSettingsRequest.is_quiz !== undefined) {
          updates.push(`quiz mode=${op.updateFormSettingsRequest.is_quiz ? "enabled" : "disabled"}`);
        }
        return `Update form settings: ${updates.join(", ")}`;
      }

      default:
        return "Unknown operation";
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
