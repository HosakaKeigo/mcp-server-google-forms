import { forms, forms_v1 } from "@googleapis/forms"
import { GoogleAuth } from 'google-auth-library';

/**
 * Formsの質問タイプ
 */
export type QuestionType = "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROPDOWN";

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
  }
}[keyof FormItemData];

/**
 * Google Forms APIを操作するためのサービスクラス
 */
export class GFormService {
  private formClient: forms_v1.Forms;

  /**
   * GFormServiceのコンストラクタ
   */
  constructor() {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/forms']
    });
    this.formClient = forms({
      version: "v1",
      auth
    });
  }

  /**
   * Google Forms APIからフォーム情報を取得する
   * @param formId フォームID
   * @returns フォーム情報
   */
  async getForm(formId: string): Promise<any> {
    try {
      const form = await this.formClient.forms.get({
        formId
      });

      if (!form) {
        throw new Error("フォームが見つかりません");
      }
      const formData = form.data;

      return {
        formId: formData.formId,
        info: formData.info,
        items: formData.items
      };
    } catch (error) {
      console.error("Error fetching form:", error);
      throw new Error(`フォームの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 共通の項目作成メソッド（型安全）
   * @param formId フォームID
   * @param title タイトル
   * @param itemType 項目タイプとそれに関連するデータ
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  private async createItem(
    formId: string,
    title: string,
    itemType: FormItemType,
    description?: string,
    index: number = 0
  ) {
    // 項目タイプに対応する日本語ラベル
    const itemTypeLabels: Record<keyof FormItemData, string> = {
      'text': 'テキスト項目',
      'pageBreak': 'ページ区切り',
      'question': '質問項目',
      'questionGroup': '質問グループ'
    };

    try {
      // 基本的な項目データ
      const itemData: forms_v1.Schema$Item = {
        title: title
      };

      // 説明があれば追加
      if (description) {
        itemData.description = description;
      }

      // 項目タイプに基づいてデータを構築
      switch (itemType.type) {
        case 'text':
          itemData.textItem = {};
          break;

        case 'pageBreak':
          itemData.pageBreakItem = {};
          break;

        case 'question':
          itemData.questionItem = {
            question: {
              required: itemType.data.required
            }
          };

          const { questionType, options } = itemType.data;

          if (questionType === "TEXT" || questionType === "PARAGRAPH_TEXT") {
            if (!itemData.questionItem.question) {
              itemData.questionItem.question = {};
            }
            itemData.questionItem.question.textQuestion = {
              paragraph: questionType === "PARAGRAPH_TEXT"
            };
          } else {
            // 選択式の質問（RADIO, CHECKBOX, DROPDOWN）
            if (!options || options.length === 0) {
              throw new Error("選択式の質問にはオプションが必要です");
            }

            if (!itemData.questionItem.question) {
              itemData.questionItem.question = {};
            }

            // 選択肢を準備
            const mappedOptions: forms_v1.Schema$Option[] = options.map(opt => ({ value: opt }));

            // includeOtherが指定されていて、RADIOまたはCHECKBOXの場合は「その他」オプションを追加
            if ((questionType === "RADIO" || questionType === "CHECKBOX") &&
              itemType.data.includeOther === true) {
              mappedOptions.push({ isOther: true });
            }

            itemData.questionItem.question.choiceQuestion = {
              type: questionType,
              options: mappedOptions
            };
          }
          break;

        case 'questionGroup':
          const qgData = itemType.data;

          // 質問グループの設定
          itemData.questionGroupItem = {
            questions: qgData.rows.map(row => ({
              required: row.required ?? false,
              rowQuestion: {
                title: row.title
              }
            }))
          };

          // グリッド形式の場合、グリッド設定を追加
          if (qgData.isGrid && qgData.gridType && qgData.columns && qgData.columns.length > 0) {
            itemData.questionGroupItem.grid = {
              shuffleQuestions: qgData.shuffleQuestions ?? false,
              columns: {
                type: qgData.gridType,
                options: qgData.columns.map(col => ({ value: col }))
              }
            };
          } else if (qgData.isGrid) {
            throw new Error("グリッド形式の質問グループには列オプションとグリッドタイプが必要です");
          }
          break;
      }

      // API呼び出し
      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [
            {
              createItem: {
                item: itemData,
                location: {
                  index: index
                }
              }
            }
          ],
          includeFormInResponse: true
        }
      });
      return result.data;
    } catch (error) {
      const typeName = itemTypeLabels[itemType.type as keyof FormItemData] || '項目';
      throw new Error(`フォームへの${typeName}追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * フォームにテキスト項目を追加する
   * @param formId フォームID
   * @param title タイトル
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  async addTextItem(
    formId: string,
    title: string,
    description?: string,
    index: number = 0
  ): Promise<any> {
    return this.createItem(
      formId,
      title,
      { type: 'text', data: {} },
      description,
      index
    );
  }

  /**
   * フォームに質問項目を追加する
   * @param formId フォームID
   * @param title タイトル
   * @param questionType 質問タイプ
   * @param options 選択肢（選択式の場合）
   * @param required 必須かどうか
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  async addQuestionItem(
    formId: string,
    title: string,
    questionType: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROPDOWN",
    options?: string[],
    required: boolean = false,
    includeOther: boolean = false,
    index: number = 0
  ): Promise<any> {
    return this.createItem(
      formId,
      title,
      {
        type: 'question',
        data: {
          required,
          questionType,
          options,
          includeOther
        }
      },
      undefined,
      index
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
      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [
            {
              moveItem: {
                originalLocation: {
                  index: originalIndex
                },
                newLocation: {
                  index: newIndex
                }
              }
            }
          ],
          includeFormInResponse: true
        }
      });
      return result.data;
    } catch (error) {
      throw new Error(`フォームの項目移動中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * フォームの基本情報（タイトルと説明）を更新する
   * @param formId フォームID
   * @param title 新しいタイトル（省略可）
   * @param description 新しい説明（省略可）
   * @returns 更新結果
   */
  async updateFormInfo(formId: string, title?: string, description?: string): Promise<any> {
    try {
      // 更新するフィールドとマスクを設定
      const info: { title?: string; description?: string } = {};
      const updateMaskParts: string[] = [];

      if (title !== undefined) {
        info.title = title;
        updateMaskParts.push('title');
      }

      if (description !== undefined) {
        info.description = description;
        updateMaskParts.push('description');
      }

      // 更新すべき項目がない場合はエラー
      if (updateMaskParts.length === 0) {
        throw new Error('更新すべき項目（タイトルまたは説明）を少なくとも1つ指定してください');
      }

      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [
            {
              updateFormInfo: {
                info,
                updateMask: updateMaskParts.join(',')
              }
            }
          ],
          includeFormInResponse: true
        }
      });
      return result.data;
    } catch (error) {
      throw new Error(`フォーム情報の更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * フォームの項目を削除する
   * @param formId フォームID
   * @param index 削除する項目のインデックス
   * @returns 更新結果
   */
  async deleteItem(formId: string, index: number): Promise<any> {
    try {
      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [
            {
              deleteItem: {
                location: {
                  index: index
                }
              }
            }
          ],
          includeFormInResponse: true
        }
      });
      return result.data;
    } catch (error) {
      throw new Error(`フォームの項目削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * フォームにページ区切りを追加する
   * @param formId フォームID
   * @param title タイトル
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  async addPageBreakItem(
    formId: string,
    title: string,
    description?: string,
    index: number = 0
  ): Promise<any> {
    return this.createItem(
      formId,
      title,
      { type: 'pageBreak', data: {} },
      description,
      index
    );
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
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  async addQuestionGroupItem(
    formId: string,
    title: string,
    rows: { title: string; required?: boolean }[],
    isGrid: boolean = false,
    columns?: string[],
    gridType?: "CHECKBOX" | "RADIO",
    shuffleQuestions?: boolean,
    description?: string,
    index: number = 0
  ): Promise<any> {
    // 行のバリデーション
    if (!rows || rows.length === 0) {
      throw new Error("質問グループには少なくとも1つの行（質問）が必要です");
    }

    // グリッド形式の場合の追加バリデーション
    if (isGrid) {
      if (!columns || columns.length === 0) {
        throw new Error("グリッド形式の質問グループには列（選択肢）が必要です");
      }
      if (!gridType) {
        throw new Error("グリッド形式の質問グループには選択タイプ（CHECKBOX または RADIO）が必要です");
      }
    }

    return this.createItem(
      formId,
      title,
      {
        type: 'questionGroup',
        data: {
          isGrid,
          gridType,
          columns,
          shuffleQuestions,
          rows
        }
      },
      description,
      index
    );
  }
}
