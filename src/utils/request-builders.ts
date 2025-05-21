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

    if (params.description) {
      item.description = params.description;
    }

    // Set data based on item type
    switch (params.itemType) {
      case "text":
        item.textItem = {};
        break;

      case "pageBreak":
        item.pageBreakItem = {};
        break;

      case "question": {
        if (!params.questionType) {
          throw new Error("questionType is required when creating a question item");
        }

        item.questionItem = {
          question: {
            required: params.required ?? false,
          },
        };

        if (params.questionType === "TEXT" || params.questionType === "PARAGRAPH_TEXT") {
          if (item.questionItem?.question) {
            item.questionItem.question.textQuestion = {
              paragraph: params.questionType === "PARAGRAPH_TEXT",
            };
          }
        } else {
          // For multiple-choice questions, options are required
          if (!params.options || params.options.length === 0) {
            throw new Error("Multiple-choice questions require options");
          }

          const optionsArray: forms_v1.Schema$Option[] = params.options.map((opt: string) => ({
            value: opt,
          }));

          // Add "Other" option
          if (
            params.includeOther &&
            (params.questionType === "RADIO" || params.questionType === "CHECKBOX")
          ) {
            optionsArray.push({ isOther: true });
          }

          if (item.questionItem?.question) {
            item.questionItem.question.choiceQuestion = {
              type: params.questionType,
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
              options: params.columns.map((col: string) => ({ value: col })),
            },
          };
        }
        break;
      }

      default:
        throw new Error(`Unknown item type: ${params.itemType}`);
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
 * @param params Parameters
 * @param currentItem Current item data (for checking required field updates)
 * @returns Update request object
 */
export function buildUpdateItemRequest(
  params: UpdateItemRequestParams,
  currentItem?: forms_v1.Schema$Item,
): forms_v1.Schema$Request | Error {
  try {
    const item: Partial<forms_v1.Schema$Item> = {};
    const updateMaskParts: string[] = [];

    // Set fields to update
    if (params.title !== undefined) {
      item.title = params.title;
      updateMaskParts.push("title");
    }

    if (params.description !== undefined) {
      item.description = params.description;
      updateMaskParts.push("description");
    }

    // For question items, update the required setting
    if (params.required !== undefined) {
      if (currentItem?.questionItem) {
        if (!item.questionItem) {
          item.questionItem = { question: {} };
        }
        if (!item.questionItem.question) {
          item.questionItem.question = {};
        }
        item.questionItem.question.required = params.required;
        updateMaskParts.push("questionItem.question.required");
      } else {
        throw new Error("The 'required' field can only be set for question items");
      }
    }

    // Error if no fields to update
    if (updateMaskParts.length === 0) {
      throw new Error("No fields specified to update");
    }

    return {
      updateItem: {
        item: item as forms_v1.Schema$Item,
        location: { index: params.index },
        updateMask: updateMaskParts.join(","),
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
      newLocation: { index: params.newIndex },
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
