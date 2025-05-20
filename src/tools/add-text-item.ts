import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema } from "../types/index.js";

/**
 * フォームにテキスト項目を追加するMCPツール
 */
export class AddTextItemTool {
  /**
   * ツール名
   */
  readonly name = "add_text_item";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsにテキスト項目（タイトルと説明のみの項目）を追加します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    title: z.string().describe("項目のタイトル"),
    description: z.string().optional().describe("項目の説明（省略可）"),
    index: z.number().optional().describe("挿入位置（省略時は先頭）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    title: string;
    description?: string;
    index?: number;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // テキスト項目を追加
      const result = await service.addTextItem(
        formId,
        args.title,
        args.description,
        args.index
      );

      return {
        content: [
          {
            type: "text",
            text: `テキスト項目 "${args.title}" をフォームに追加しました。`,
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
