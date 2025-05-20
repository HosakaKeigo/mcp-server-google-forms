import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { updateForm } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema, BatchUpdateFormRequest } from "../types/index.js";

/**
 * フォームを更新するMCPツール
 */
export class UpdateFormTool {
  /**
   * ツール名
   */
  readonly name = "update_form";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsを更新します。BatchUpdateFormRequestの形式に従ったJSONを指定してください。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    update_data: z.string().describe("更新データ (BatchUpdateFormRequestの形式に従ったJSON文字列)"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: { form_url: string; update_data: string }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);
      
      // 更新データをパース
      let updateData: BatchUpdateFormRequest;
      try {
        updateData = JSON.parse(args.update_data);
      } catch (e) {
        throw new Error("更新データのJSONパースに失敗しました");
      }
      
      // フォームを更新
      const result = await updateForm(formId, updateData);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}