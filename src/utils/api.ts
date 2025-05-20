import { forms } from "@googleapis/forms"
import { GoogleAuth } from 'google-auth-library';
import { GoogleApiError } from '../types/index.js';

/**
 * Google Forms APIを操作するためのサービスクラス
 */
export class GFormService {
  private auth: GoogleAuth;
  private readonly BASE_URL = "https://forms.googleapis.com/v1";

  /**
   * GFormServiceのコンストラクタ
   */
  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/forms']
    });
  }

  /**
   * Forms APIクライアントを取得する
   * @returns Forms APIクライアント
   */
  private async getClient() {
    return forms({
      version: "v1",
      auth: this.auth
    });
  }

  /**
   * 認証用のヘッダーを取得する
   * @returns 認証用ヘッダー
   */
  private async getAuthHeaders() {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    return {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Google Forms APIからフォーム情報を取得する
   * @param formId フォームID
   * @returns フォーム情報
   */
  async getForm(formId: string): Promise<any> {
    try {
      const client = await this.getClient();
      const form = await client.forms.get({
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
   * フォームに項目を追加する
   * @param formId フォームID
   * @param itemData 追加する項目のデータ
   * @returns 更新結果
   */
  async addItem(formId: string, itemData: any): Promise<any> {
    try {
      const updateData = {
        requests: [
          {
            createItem: {
              item: itemData
            }
          }
        ]
      };

      return await this.updateForm(formId, updateData);
    } catch (error) {
      throw new Error(`フォームへの項目追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Google Forms APIを使用してフォームを更新する
   * @param formId フォームID
   * @param updateData 更新データ
   * @returns 更新結果
   */
  async updateForm(formId: string, updateData: any): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.BASE_URL}/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json() as GoogleApiError;
        throw new Error(`API Error (${response.status}): ${errorData.error.message}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`フォームの更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
