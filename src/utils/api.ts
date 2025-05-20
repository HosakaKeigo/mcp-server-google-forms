import { getAuthConfig } from "./auth.js";
import { GoogleApiError } from "../types/index.js";
import { forms } from "@googleapis/forms"
import { GoogleAuth } from 'google-auth-library';

/**
 * Google Forms APIからフォーム情報を取得する
 * @param formId フォームID
 * @returns フォーム情報
 */
export async function getForm(formId: string): Promise<any> {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/forms']
    });
    const client = forms({ version: "v1" })
    const form = await client.forms.get({
      formId,
      auth
    })
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

///**
// * Google Forms APIを使用してフォームを更新する
// * @param formId フォームID
// * @param updateData 更新データ
// * @returns 更新結果
// */
//export async function updateForm(formId: string, updateData: any): Promise<any> {
//  try {
//    // 認証設定の確認
//    getAuthConfig();

//    const headers = await getAuthHeaders();
//    const response = await fetch(`${BASE_URL}/forms/${formId}:batchUpdate`, {
//      method: "POST",
//      headers,
//      body: JSON.stringify(updateData),
//    });

//    if (!response.ok) {
//      const errorData = await response.json() as GoogleApiError;
//      throw new Error(`API Error (${response.status}): ${errorData.error.message}`);
//    }

//    return await response.json();
//  } catch (error) {
//    throw new Error(`フォームの更新中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
//  }
//}