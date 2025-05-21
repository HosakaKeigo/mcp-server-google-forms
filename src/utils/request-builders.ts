import type { forms_v1 } from "@googleapis/forms";
import type {
  CreateItemRequestParams,
  DeleteItemRequestParams,
  MoveItemRequestParams,
  UpdateFormInfoRequestParams,
  UpdateItemRequestParams,
} from "../types/request-types.js";

/**
 * Request builder: Generate create item request
 * @param params Parameters
 * @returns Create request object
 */
export function buildCreateItemRequest(
  params: CreateItemRequestParams,
): forms_v1.Schema$Request | Error {
  try {
    if (!params.title) {
      throw new Error("Title is required when creating an item");
    }

    // Build item data
    const item: forms_v1.Schema$Item = {
      title: params.title,
    };

    // Optional item ID for branching logic
    if (params.item_id) {
      item.itemId = params.item_id;
    }

    if (params.description) {
      item.description = params.description;
    }

    // Set data based on item type
    switch (params.item_type) {
      case "text":
        item.textItem = {};
        break;

      case "pageBreak":
        item.pageBreakItem = {};
        break;

      case "question": {
        if (!params.question_type) {
          throw new Error("questionType is required when creating a question item");
        }

        item.questionItem = {
          question: {
            required: params.required ?? false,
          },
        };

        if (params.question_type === "TEXT" || params.question_type === "PARAGRAPH_TEXT") {
          if (item.questionItem?.question) {
            item.questionItem.question.textQuestion = {
              paragraph: params.question_type === "PARAGRAPH_TEXT",
            };
          }
        } else {
          // For multiple-choice questions, options are required
          if (!params.options || params.options.length === 0) {
            throw new Error("Multiple-choice questions require options");
          }

          // Process options with unified format
          const optionsArray: forms_v1.Schema$Option[] = [];

          for (const opt of params.options) {
            const option: forms_v1.Schema$Option = { value: opt.value };

            // Add branching logic if present
            if (opt.goToAction) {
              option.goToAction = opt.goToAction;
            } else if (opt.goToSectionId) {
              option.goToSectionId = opt.goToSectionId;
            }

            optionsArray.push(option);
          }

          // Add "Other" option
          if (
            params.include_other &&
            (params.question_type === "RADIO" || params.question_type === "CHECKBOX")
          ) {
            optionsArray.push({ isOther: true });
          }

          if (item.questionItem?.question) {
            item.questionItem.question.choiceQuestion = {
              type: params.question_type,
              options: optionsArray,
            };
          }
        }
        break;
      }

      case "questionGroup": {
        if (!params.rows || params.rows.length === 0) {
          throw new Error("Question group requires at least one row (question)");
        }
        item.questionGroupItem = {
          questions: params.rows.map((row: { title: string; required?: boolean }) => ({
            required: row.required ?? false,
            rowQuestion: {
              title: row.title,
            },
          })),
        };
        if (params.isGrid) {
          if (!params.columns || params.columns.length === 0) {
            throw new Error("Grid-style question group requires columns (options)");
          }
          if (!params.gridType) {
            throw new Error(
              "Grid-style question group requires a selection type (CHECKBOX or RADIO)",
            );
          }
          item.questionGroupItem.grid = {
            shuffleQuestions: params.shuffleQuestions ?? false,
            columns: {
              type: params.gridType,
              options: params.columns ? params.columns.map(col => ({ value: col.value })) : [],
            },
          };
        }
        break;
      }

      default:
        throw new Error(`Unknown item type: ${params.item_type}`);
    }

    return {
      createItem: {
        item,
        location: { index: params.index ?? 0 },
      },
    };
  } catch (error) {
    return error as Error;
  }
}

/**
 * Request builder: Generate update item request
 * @param params Parameters containing item, location and updateMask
 * @returns Update request object
 */
export function buildUpdateItemRequest(
  params: UpdateItemRequestParams,
): forms_v1.Schema$Request | Error {
  try {
    if (!params.item) {
      throw new Error("item is required for updating an item");
    }

    if (params.index === undefined) {
      throw new Error("index is required for updating an item");
    }

    if (!params.update_mask) {
      throw new Error("updateMask is required for updating an item");
    }

    return {
      updateItem: {
        item: params.item,
        location: { index: params.index },
        updateMask: params.update_mask,
      },
    };
  } catch (error) {
    return error as Error;
  }
}

/**
 * Request builder: Generate delete item request
 * @param params Parameters
 * @returns Delete request object
 */
export function buildDeleteItemRequest(params: DeleteItemRequestParams): forms_v1.Schema$Request {
  return {
    deleteItem: {
      location: { index: params.index },
    },
  };
}

/**
 * Request builder: Generate move item request
 * @param params Parameters
 * @returns Move request object
 */
export function buildMoveItemRequest(params: MoveItemRequestParams): forms_v1.Schema$Request {
  return {
    moveItem: {
      originalLocation: { index: params.index },
      newLocation: { index: params.new_index },
    },
  };
}

/**
 * Request builder: Generate update form info request
 * @param params Parameters
 * @returns Update request object
 */
export function buildUpdateFormInfoRequest(
  params: UpdateFormInfoRequestParams,
): forms_v1.Schema$Request | Error {
  try {
    const info: { title?: string; description?: string } = {};
    const updateMaskParts: string[] = [];

    if (params.title !== undefined) {
      info.title = params.title;
      updateMaskParts.push("title");
    }

    if (params.description !== undefined) {
      info.description = params.description;
      updateMaskParts.push("description");
    }

    // Error if no fields to update
    if (updateMaskParts.length === 0) {
      throw new Error("No form information specified to update");
    }

    return {
      updateFormInfo: {
        info,
        updateMask: updateMaskParts.join(","),
      },
    };
  } catch (error) {
    return error as Error;
  }
}
