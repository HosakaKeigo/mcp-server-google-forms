import type { forms_v1 } from "@googleapis/forms";

/**
 * アイテム作成リクエストを生成するためのパラメータ
 */
export type CreateItemRequestParams = {
  title: string;
  description?: string;
  index?: number;
  itemType: "text" | "question" | "pageBreak" | "questionGroup";
  questionType?: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";
  options?: string[];
  required?: boolean;
  includeOther?: boolean;
  // question_group専用
  rows?: { title: string; required?: boolean }[];
  isGrid?: boolean;
  columns?: string[];
  gridType?: "CHECKBOX" | "RADIO";
  shuffleQuestions?: boolean;
};

/**
 * アイテム更新リクエストを生成するためのパラメータ
 */
export type UpdateItemRequestParams = {
  index: number;
  title?: string;
  description?: string;
  required?: boolean;
};

/**
 * アイテム削除リクエストを生成するためのパラメータ
 */
export type DeleteItemRequestParams = {
  index: number;
};

/**
 * アイテム移動リクエストを生成するためのパラメータ
 */
export type MoveItemRequestParams = {
  index: number;
  newIndex: number;
};

/**
 * フォーム情報更新リクエストを生成するためのパラメータ
 */
export type UpdateFormInfoRequestParams = {
  title?: string;
  description?: string;
};

/**
 * リクエストビルダー：アイテムの作成リクエストを生成
 * @param params パラメータ
 * @returns 作成リクエストオブジェクト
 */
export function buildCreateItemRequest(
  params: CreateItemRequestParams,
): forms_v1.Schema$Request | Error {
  try {
    if (!params.title) {
      throw new Error("項目作成時はtitleが必須です");
    }

    // 項目データの構築
    const item: forms_v1.Schema$Item = {
      title: params.title,
    };

    if (params.description) {
      item.description = params.description;
    }

    // 項目タイプに基づいてデータを設定
    switch (params.itemType) {
      case "text":
        item.textItem = {};
        break;

      case "pageBreak":
        item.pageBreakItem = {};
        break;

      case "question": {
        if (!params.questionType) {
          throw new Error("質問項目作成時はquestionTypeが必須です");
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
          // 選択式の質問の場合、選択肢が必要
          if (!params.options || params.options.length === 0) {
            throw new Error("選択式質問には選択肢が必要です");
          }

          const optionsArray: forms_v1.Schema$Option[] = params.options.map((opt) => ({
            value: opt,
          }));

          // 「その他」オプションの追加
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
          throw new Error("質問グループには少なくとも1つの行（質問）が必要です");
        }
        item.questionGroupItem = {
          questions: params.rows.map((row) => ({
            required: row.required ?? false,
            rowQuestion: {
              title: row.title,
            },
          })),
        };
        if (params.isGrid) {
          if (!params.columns || params.columns.length === 0) {
            throw new Error("グリッド形式の質問グループには列（選択肢）が必要です");
          }
          if (!params.gridType) {
            throw new Error(
              "グリッド形式の質問グループには選択タイプ（CHECKBOX または RADIO）が必要です",
            );
          }
          item.questionGroupItem.grid = {
            shuffleQuestions: params.shuffleQuestions ?? false,
            columns: {
              type: params.gridType,
              options: params.columns.map((col) => ({ value: col })),
            },
          };
        }
        break;
      }

      default:
        throw new Error(`不明な項目タイプ: ${params.itemType}`);
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
 * リクエストビルダー：アイテムの更新リクエストを生成
 * @param params パラメータ
 * @param currentItem 現在の項目データ（requiredフィールドの更新チェック用）
 * @returns 更新リクエストオブジェクト
 */
export function buildUpdateItemRequest(
  params: UpdateItemRequestParams,
  currentItem?: forms_v1.Schema$Item,
): forms_v1.Schema$Request | Error {
  try {
    const item: Partial<forms_v1.Schema$Item> = {};
    const updateMaskParts: string[] = [];

    // 更新するフィールドを設定
    if (params.title !== undefined) {
      item.title = params.title;
      updateMaskParts.push("title");
    }

    if (params.description !== undefined) {
      item.description = params.description;
      updateMaskParts.push("description");
    }

    // 質問項目の場合、必須設定を更新
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
        throw new Error("requiredは質問項目にのみ設定できます");
      }
    }

    // 更新するフィールドがない場合はエラー
    if (updateMaskParts.length === 0) {
      throw new Error("更新するフィールドが指定されていません");
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
 * リクエストビルダー：アイテムの削除リクエストを生成
 * @param params パラメータ
 * @returns 削除リクエストオブジェクト
 */
export function buildDeleteItemRequest(params: DeleteItemRequestParams): forms_v1.Schema$Request {
  return {
    deleteItem: {
      location: { index: params.index },
    },
  };
}

/**
 * リクエストビルダー：アイテムの移動リクエストを生成
 * @param params パラメータ
 * @returns 移動リクエストオブジェクト
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
 * リクエストビルダー：フォーム情報の更新リクエストを生成
 * @param params パラメータ
 * @returns 更新リクエストオブジェクト
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

    // 更新するフィールドがない場合はエラー
    if (updateMaskParts.length === 0) {
      throw new Error("更新するフォーム情報が指定されていません");
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
