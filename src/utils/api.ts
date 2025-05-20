import { forms, type forms_v1 } from "@googleapis/forms";
import { GoogleAuth } from "google-auth-library";
import {
  buildCreateItemRequest,
  buildUpdateItemRequest,
  buildDeleteItemRequest,
  buildMoveItemRequest,
  buildUpdateFormInfoRequest,
  type CreateItemRequestParams,
} from "./request-builders.js";

/**
 * Formsの質問タイプ
 */
export type QuestionType = "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";

/**
 * Google Formsの項目データ型
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
  // 将来的に新しい項目タイプを追加する場合、ここに定義を追加するだけでよい
  // 例: image: { url: string; width?: number };
};

/**
 * Google Formsの項目タイプを表す型
 */
export type FormItemType = {
  [K in keyof FormItemData]: {
    type: K;
    data: FormItemData[K];
  };
}[keyof FormItemData];

/**
 * Google Forms APIを操作するためのサービスクラス
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
   * Google Forms APIからフォーム情報を取得する
   * @param formId フォームID
   * @returns フォーム情報
   */
  async getForm(formId: string): Promise<forms_v1.Schema$Form> {
    try {
      const form = await this.formClient.forms.get({
        formId,
      });

      if (!form) {
        throw new Error("フォームが見つかりません");
      }
      const formData = form.data;

      return formData;
    } catch (error) {
      console.error("Error fetching form:", error);
      throw new Error(
        `フォームの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 共通の項目作成メソッド（型安全）
   * @param formId フォームID
   * @param title タイトル
   * @param itemType 項目タイプとそれに関連するデータ
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は末尾）
   * @returns 更新結果
   */
  private async createItem(
    formId: string,
    title: string,
    itemType: FormItemType,
    description?: string,
    index?: number,
  ) {
    // 項目タイプに対応する日本語ラベル
    const itemTypeLabels: Record<keyof FormItemData, string> = {
      text: "テキスト項目",
      pageBreak: "ページ区切り",
      question: "質問項目",
      questionGroup: "質問グループ",
    };

    try {
      // indexが指定されていない場合は、フォームの最後に追加
      let itemIndex = 0;
      if (index === undefined) {
        const form = await this.getForm(formId);
        itemIndex = form.items ? form.items.length : 0;
      }
      const createItemParams: CreateItemRequestParams = {
        title,
        description,
        index: itemIndex,
        itemType: itemType.type
      };

      // 項目タイプに基づいてパラメータを追加
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
      const typeName = itemTypeLabels[itemType.type as keyof FormItemData] || "項目";
      throw new Error(
        `フォームへの${typeName}追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームにテキスト項目を追加する
   * @param formId フォームID
   * @param title タイトル
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は末尾）
   * @returns 更新結果
   */
  async addTextItem(formId: string, title: string, description?: string, index?: number) {
    return this.createItem(formId, title, { type: "text", data: {} }, description, index);
  }

  /**
   * フォームに質問項目を追加する
   * @param formId フォームID
   * @param title タイトル
   * @param questionType 質問タイプ
   * @param options 選択肢（選択式の場合）
   * @param required 必須かどうか
   * @param index 挿入位置（省略時は末尾）
   * @returns 更新結果
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
   * フォームの項目を移動する
   * @param formId フォームID
   * @param originalIndex 移動元のインデックス
   * @param newIndex 移動先のインデックス
   * @returns 更新結果
   */
  async moveItem(formId: string, originalIndex: number, newIndex: number) {
    try {
      // buildMoveItemRequestを使用
      const request = buildMoveItemRequest({
        index: originalIndex,
        newIndex: newIndex
      });

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `フォームの項目移動中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームの基本情報（タイトルと説明）を更新する
   * @param formId フォームID
   * @param title 新しいタイトル（省略可）
   * @param description 新しい説明（省略可）
   * @returns 更新結果
   */
  async updateFormInfo(formId: string, title?: string, description?: string) {
    try {
      const request = buildUpdateFormInfoRequest({
        title,
        description
      });

      if (request instanceof Error) {
        throw request;
      }

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `フォーム情報の更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームの項目を削除する
   * @param formId フォームID
   * @param index 削除する項目のインデックス
   * @returns 更新結果
   */
  async deleteItem(formId: string, index: number) {
    try {
      // buildDeleteItemRequestを使用
      const request = buildDeleteItemRequest({
        index: index
      });

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `フォームの項目削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームにページ区切りを追加する
   * @param formId フォームID
   * @param title タイトル
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は末尾）
   * @returns 更新結果
   */
  async addPageBreakItem(formId: string, title: string, description?: string, index?: number) {
    return this.createItem(formId, title, { type: "pageBreak", data: {} }, description, index);
  }

  /**
   * フォームに質問グループを追加する
   * @param formId フォームID
   * @param title タイトル
   * @param rows 行（質問）のリスト
   * @param isGrid グリッド形式かどうか
   * @param columns グリッド形式の場合の列（選択肢）
   * @param gridType グリッド形式の場合の選択タイプ（ラジオボタンまたはチェックボックス）
   * @param shuffleQuestions 質問をランダムに並べ替えるかどうか
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は末尾）
   * @returns 更新結果
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
      throw new Error("質問グループには少なくとも1つの行（質問）が必要です");
    }
    if (isGrid) {
      if (!columns || columns.length === 0) {
        throw new Error("グリッド形式の質問グループには列（選択肢）が必要です");
      }
      if (!gridType) {
        throw new Error(
          "グリッド形式の質問グループには選択タイプ（CHECKBOX または RADIO）が必要です",
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
   * フォームの設定を更新する
   * @param formId フォームID
   * @param settings 更新する設定
   * @param updateMask 更新対象のフィールドを指定するマスク
   * @returns 更新結果
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
        `フォーム設定の更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 新しいフォームを作成する
   * @param title フォームのタイトル
   * @param documentTitle ドキュメントのタイトル（省略時はtitleと同じ）
   * @param unpublished 公開しないかどうか（trueの場合は回答を受け付けない）
   * @returns フォーム作成結果
   */
  async createForm(title: string, documentTitle?: string, unpublished = false) {
    try {
      const form: forms_v1.Schema$Form = {
        info: {
          title,
        },
      };

      // ドキュメントタイトルを設定（省略時はtitleと同じ）
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
        `フォームの作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームの項目を更新する
   * @param formId フォームID
   * @param index 更新する項目のインデックス
   * @param item 更新する項目のデータ
   * @param updateMask 更新対象のフィールドを指定するマスク
   * @returns 更新結果
   */
  async updateItem(formId: string, index: number, item: forms_v1.Schema$Item) {
    try {
      const form = await this.getForm(formId);
      if (!form.items || index >= form.items.length) {
        throw new Error(`インデックス ${index} の項目が見つかりません`);
      }

      const currentItem = form.items[index];
      const request = buildUpdateItemRequest({
        index,
        title: item.title ?? undefined,
        description: item.description ?? undefined,
        required: item.questionItem?.question?.required ?? undefined,
      }, currentItem);

      if (request instanceof Error) {
        throw request;
      }

      return await this.batchUpdateForm(formId, [request]);
    } catch (error) {
      throw new Error(
        `フォームの項目更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * フォームに対して複数の操作を一括で行う
   * @param formId フォームID
   * @param requests 実行するリクエスト配列
   * @returns 更新結果
   */
  async batchUpdateForm(formId: string, requests: forms_v1.Schema$Request[]) {
    try {
      // リクエストが空の場合はエラー
      if (requests.length === 0) {
        throw new Error("実行するリクエストがありません");
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
        `フォームの更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
