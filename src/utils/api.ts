import { forms, type forms_v1 } from "@googleapis/forms";
import { GoogleAuth } from "google-auth-library";
import { ERROR_MESSAGES } from "../constants/errors.js";
import type { CreateItemRequestParams } from "../types/request-types.js";
import {
  buildCreateItemRequest,
  buildDeleteItemRequest,
  buildMoveItemRequest,
  buildUpdateFormInfoRequest,
  buildUpdateItemRequest,
} from "./request-builders.js";

/**
 * Question types for Forms
 */
export type QuestionType = "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";

/**
 * Google Forms item data type
 */
export type FormItemData = {
  text: Record<string, never>;
  pageBreak: Record<string, never>;
  question: {
    required: boolean;
    questionType: QuestionType;
    options?: string[];
    includeOther?: boolean;
  };
  questionGroup: {
    isGrid: boolean;
    gridType?: "CHECKBOX" | "RADIO";
    columns?: string[];
    shuffleQuestions?: boolean;
    rows: { title: string; required?: boolean }[];
  };
  // When adding new item types in the future, just add definitions here
  // Example: image: { url: string; width?: number };
};

/**
 * Type representing Google Forms item types
 */
export type FormItemType = {
  [K in keyof FormItemData]: {
    type: K;
    data: FormItemData[K];
  };
}[keyof FormItemData];

/**
 * Service class for operating the Google Forms API
 */
export class GFormService {
  private formClient: forms_v1.Forms;

  constructor() {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/forms"],
    });
    this.formClient = forms({
      version: "v1",
      auth,
    });
  }

  /**
   * Retrieve form information from Google Forms API
   * @param formId Form ID
   * @returns Form information
   */
  async getForm(formId: string): Promise<forms_v1.Schema$Form> {
    try {
      const form = await this.formClient.forms.get({
        formId,
      });

      if (!form) {
        throw new Error(ERROR_MESSAGES.FORM_NOT_FOUND);
      }
      const formData = form.data;

      return formData;
    } catch (error) {
      console.error("Error fetching form:", error);
      throw new Error(
        `${ERROR_MESSAGES.API_ERROR}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Common method for creating items (type-safe)
   * @param formId Form ID
   * @param title Title
   * @param itemType Item type and related data
   * @param description Description (optional)
   * @param index Insertion position (end of form if omitted)
   * @returns Update result
   */
  private async createItem(
    formId: string,
    title: string,
    itemType: FormItemType,
    description?: string,
    index?: number,
  ) {
    // Labels for item types
    const itemTypeLabels: Record<keyof FormItemData, string> = {
      text: "Text item",
      pageBreak: "Page break",
      question: "Question item",
      questionGroup: "Question group",
    };

    try {
      // If index is not specified, add to the end of the form
      let itemIndex = 0;
      if (index === undefined) {
        const form = await this.getForm(formId);
        itemIndex = form.items ? form.items.length : 0;
      }
      const createItemParams: CreateItemRequestParams = {
        title,
        description,
        index: itemIndex,
        itemType: itemType.type,
      };

      // Add parameters based on item type
      switch (itemType.type) {
        case "question": {
          const { questionType, options, required, includeOther } = itemType.data;
          createItemParams.questionType = questionType;
          createItemParams.options = options;
          createItemParams.required = required;
          createItemParams.includeOther = includeOther;
          break;
        }
        case "questionGroup": {
          const qgData = itemType.data;
          createItemParams.rows = qgData.rows;
          createItemParams.isGrid = qgData.isGrid;
          if (qgData.isGrid) {
            createItemParams.columns = qgData.columns;
            createItemParams.gridType = qgData.gridType;
            createItemParams.shuffleQuestions = qgData.shuffleQuestions;
          }
          break;
        }
      }

      const request = buildCreateItemRequest(createItemParams);

      if (request instanceof Error) {
        throw request;
      }

      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [request],
          includeFormInResponse: true,
        },
      });
      return result.data;
    } catch (error) {
      const typeName = itemTypeLabels[itemType.type as keyof FormItemData] || "item";
      throw new Error(
        `Error occurred while adding ${typeName} to form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Add a text item to a form
   * @param formId Form ID
   * @param title Title
   * @param description Description (optional)
   * @param index Insertion position (end of form if omitted)
   * @returns Update result
   */
  async addTextItem(formId: string, title: string, description?: string, index?: number) {
    return this.createItem(formId, title, { type: "text", data: {} }, description, index);
  }

  /**
   * Add a question item to a form
   * @param formId Form ID
   * @param title Title
   * @param questionType Question type
   * @param options Options (for selection-type questions)
   * @param required Whether the question is required
   * @param index Insertion position (end of form if omitted)
   * @returns Update result
   */
  async addQuestionItem(
    formId: string,
    title: string,
    questionType: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN",
    options?: string[],
    required = false,
    includeOther = false,
    index?: number,
  ) {
    return this.createItem(
      formId,
      title,
      {
        type: "question",
        data: {
          required,
          questionType,
          options,
          includeOther,
        },
      },
      undefined,
      index,
    );
  }

  /**
   * Move an item within a form
   * @param formId Form ID
   * @param originalIndex Original index
   * @param newIndex New index
   * @returns Update result
   */
  async moveItem(formId: string, originalIndex: number, newIndex: number) {
    try {
      // Use buildMoveItemRequest
      const request = buildMoveItemRequest({
        index: originalIndex,
        newIndex: newIndex,
      });

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `Error occurred while moving item in form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update basic form information (title and description)
   * @param formId Form ID
   * @param title New title (optional)
   * @param description New description (optional)
   * @returns Update result
   */
  async updateFormInfo(formId: string, title?: string, description?: string) {
    try {
      const request = buildUpdateFormInfoRequest({
        title,
        description,
      });

      if (request instanceof Error) {
        throw request;
      }

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `Error occurred while updating form information: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete an item from a form
   * @param formId Form ID
   * @param index Index of the item to delete
   * @returns Update result
   */
  async deleteItem(formId: string, index: number) {
    try {
      // Use buildDeleteItemRequest
      const request = buildDeleteItemRequest({
        index: index,
      });

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `Error occurred while deleting form item: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Add a page break to a form
   * @param formId Form ID
   * @param title Title
   * @param description Description (optional)
   * @param index Insertion position (end of form if omitted)
   * @returns Update result
   */
  async addPageBreakItem(formId: string, title: string, description?: string, index?: number) {
    return this.createItem(formId, title, { type: "pageBreak", data: {} }, description, index);
  }

  /**
   * Add a question group to a form
   * @param formId Form ID
   * @param title Title
   * @param rows List of rows (questions)
   * @param isGrid Whether to use grid format
   * @param columns Grid columns (options) when using grid format
   * @param gridType Grid selection type (radio buttons or checkboxes)
   * @param shuffleQuestions Whether to randomize question order
   * @param description Description (optional)
   * @param index Insertion position (end of form if omitted)
   * @returns Update result
   */
  async addQuestionGroupItem(
    formId: string,
    title: string,
    rows: { title: string; required?: boolean }[],
    isGrid = false,
    columns?: string[],
    gridType?: "CHECKBOX" | "RADIO",
    shuffleQuestions?: boolean,
    description?: string,
    index?: number,
  ) {
    if (!rows || rows.length === 0) {
      throw new Error("Question group requires at least one row (question)");
    }
    if (isGrid) {
      if (!columns || columns.length === 0) {
        throw new Error("Grid-style question group requires columns (options)");
      }
      if (!gridType) {
        throw new Error(
          "Grid-style question group requires a selection type (CHECKBOX or RADIO)",
        );
      }
    }
    return this.createItem(
      formId,
      title,
      {
        type: "questionGroup",
        data: {
          isGrid,
          gridType,
          columns,
          shuffleQuestions,
          rows,
        },
      },
      description,
      index,
    );
  }

  /**
   * Update form settings
   * @param formId Form ID
   * @param settings Settings to update
   * @param updateMask Mask specifying which fields to update
   * @returns Update result
   */
  async updateSettings(
    formId: string,
    settings: {
      emailCollectionType?: string;
      quizSettings?: {
        isQuiz?: boolean;
        releaseGrade?: string;
      };
    },
    updateMask: string,
  ) {
    try {
      const requests = [
        {
          updateSettings: {
            settings,
            updateMask,
          },
        },
      ];
      return await this.batchUpdateForm(formId, requests);
    } catch (error) {
      throw new Error(
        `Error occurred while updating form settings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a new form
   * @param title Form title
   * @param documentTitle Document title (same as title if omitted)
   * @param unpublished Whether the form should not be published (if true, does not accept responses)
   * @returns Form creation result
   */
  async createForm(title: string, documentTitle?: string, unpublished = false) {
    try {
      const form: forms_v1.Schema$Form = {
        info: {
          title,
        },
      };

      // Set document title (same as title if omitted)
      if (documentTitle) {
        if (!form.info) {
          form.info = {};
        }
        form.info.documentTitle = documentTitle;
      }

      const result = await this.formClient.forms.create({
        unpublished,
        requestBody: form,
      });

      return result.data;
    } catch (error) {
      throw new Error(
        `Error occurred while creating form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update a form item
   * @param formId Form ID
   * @param index Index of the item to update
   * @param item Item data to update
   * @param updateMask Mask specifying which fields to update
   * @returns Update result
   */
  async updateItem(formId: string, index: number, item: forms_v1.Schema$Item) {
    try {
      const form = await this.getForm(formId);
      if (!form.items || index >= form.items.length) {
        throw new Error(`Item at index ${index} not found`);
      }

      const currentItem = form.items[index];
      const request = buildUpdateItemRequest(
        {
          index,
          title: item.title ?? undefined,
          description: item.description ?? undefined,
          required: item.questionItem?.question?.required ?? undefined,
        },
        currentItem,
      );

      if (request instanceof Error) {
        throw request;
      }

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `Error occurred while updating form item: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Perform multiple operations on a form in a batch
   * @param formId Form ID
   * @param requests Array of requests to execute
   * @returns Update result
   */
  async batchUpdateForm(formId: string, requests: forms_v1.Schema$Request[]) {
    try {
      // Error if requests array is empty
      if (requests.length === 0) {
        throw new Error("No requests to execute");
      }

      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: requests,
          includeFormInResponse: true,
        },
      });
      return result.data;
    } catch (error) {
      throw new Error(
        `Error occurred while updating form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
