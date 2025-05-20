import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * フォームの項目を移動するMCPツール
 */
export class MoveItemTool {
  /**
   * ツール名
   */
  readonly name = "move_item";

  /**
   * ツールの説明
   */
  readonly description = "Google Forms内の項目を別の位置に移動します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    original_index: z
      .number()
      .int()
      .min(0)
      .describe("移動する項目の現在のインデックス（0から始まる）"),
    new_index: z.number().int().min(0).describe("移動先のインデックス（0から始まる）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    original_index: number;
    new_index: number;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // インデックスが範囲内かチェック（厳密なチェックはAPI側で行われる）
      if (args.original_index < 0 || args.new_index < 0) {
        throw new Error("インデックスは0以上の値である必要があります");
      }

      // 同じ位置への移動をチェック
      if (args.original_index === args.new_index) {
        return {
          content: [
            {
              type: "text",
              text: `項目はすでにインデックス ${args.original_index} の位置にあります。移動は不要です。`,
            },
          ],
        };
      }

      // サービスのインスタンス化
      const service = new GFormService();

      // 項目を移動
      const result = await service.moveItem(formId, args.original_index, args.new_index);

      return {
        content: [
          {
            type: "text",
            text: `項目をインデックス ${args.original_index} から ${args.new_index} に移動しました。`,
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
