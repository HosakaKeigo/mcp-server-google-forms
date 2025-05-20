import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema } from "../types/index.js";

/**
 * フォームの項目を削除するMCPツール
 */
export class DeleteItemTool {
  /**
   * ツール名
   */
  readonly name = "delete_item";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsの項目を削除します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    index: z.number().int().min(0).describe("削除する項目のインデックス（0から始まる）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    index: number;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // フォーム情報取得（インデックスの確認のため）
      const form = await service.getForm(formId);

      // インデックスの範囲確認
      if (args.index < 0 || !form.items || args.index >= form.items.length) {
        throw new Error(`インデックス ${args.index} が範囲外です。フォームには ${form.items ? form.items.length : 0} 個の項目があります。`);
      }

      // 削除する項目の情報を取得
      const itemToDelete = form.items[args.index];

      // 項目を削除
      await service.deleteItem(formId, args.index);

      return {
        content: [
          {
            type: "text",
            text: `インデックス ${args.index} の項目「${itemToDelete.title || "無題"}」を削除しました。`,
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
