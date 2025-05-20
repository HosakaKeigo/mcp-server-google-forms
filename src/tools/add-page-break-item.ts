import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema } from "../types/index.js";

/**
 * フォームにページ区切りを追加するMCPツール
 */
export class AddPageBreakItemTool {
  /**
   * ツール名
   */
  readonly name = "add_page_break_item";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsに新しいページ区切りを追加します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    title: z.string().describe("ページ区切りのタイトル（新しいページの冒頭に表示されます）"),
    description: z.string().optional().describe("ページ区切りの説明（省略可）"),
    index: z.number().int().min(0).optional().describe("挿入位置（省略時は先頭）"),
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

      // フォーム情報取得（インデックスの確認のため）
      const form = await service.getForm(formId);

      // インデックスの指定がある場合は範囲確認
      if (args.index !== undefined) {
        const maxIndex = form.items ? form.items.length : 0;
        if (args.index < 0 || args.index > maxIndex) {
          throw new Error(`インデックス ${args.index} が範囲外です。フォームには ${maxIndex} 個の項目があります。有効な範囲は 0～${maxIndex} です。`);
        }
      }

      // ページ区切りを追加
      const index = args.index !== undefined ? args.index : 0;
      const result = await service.addPageBreakItem(
        formId,
        args.title,
        args.description,
        index
      );

      const indexText = index === 0
        ? "先頭"
        : form.items && index >= form.items.length
          ? "末尾"
          : `インデックス ${index}`;

      return {
        content: [
          {
            type: "text",
            text: `フォームに新しいページ区切り「${args.title}」を${indexText}に追加しました。`,
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
