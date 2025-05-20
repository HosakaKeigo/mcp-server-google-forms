import { forms, forms_v1 } from "@googleapis/forms"
import { GoogleAuth } from 'google-auth-library';
import { GoogleApiError } from '../types/index.js';

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
   * フォームにテキスト項目を追加する
   * @param formId フォームID
   * @param title タイトル
   * @param description 説明（省略可）
   * @param index 挿入位置（省略時は先頭）
   * @returns 更新結果
   */
  async addTextItem(formId: string, title: string, description?: string, index: number = 0): Promise<any> {
    try {
      const itemData: {
        title: string;
        description?: string;
        textItem: Record<string, never>;
      } = {
        title: title,
        textItem: {}
      };

      if (description) {
        itemData.description = description;
      }

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
      throw new Error(`フォームへのテキスト項目追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    index: number = 0
  ): Promise<any> {
    try {
      const itemData: any = {
        title: title,
        questionItem: {
          question: {
            required: required
          }
        }
      };

      // 質問タイプに応じた設定
      if (questionType === "TEXT" || questionType === "PARAGRAPH_TEXT") {
        itemData.questionItem.question.textQuestion = {
          paragraph: questionType === "PARAGRAPH_TEXT"
        };
      } else {
        // 選択式の質問（RADIO, CHECKBOX, DROPDOWN）
        if (!options || options.length === 0) {
          throw new Error("選択式の質問にはオプションが必要です");
        }

        itemData.questionItem.question.choiceQuestion = {
          type: questionType,
          options: options.map(opt => ({ value: opt }))
        };
      }

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
      throw new Error(`フォームへの質問項目追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
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
}
