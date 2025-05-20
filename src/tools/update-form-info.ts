import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema } from "../types/index.js";

/**
 * フォーム情報を更新するMCPツール
 */
export class UpdateFormInfoTool {
  /**
   * ツール名
   */
  readonly name = "update_form_info";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsの基本情報（タイトルと説明）を更新します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    title: z.string().optional().describe("フォームの新しいタイトル（省略可）"),
    description: z.string().optional().describe("フォームの新しい説明（省略可）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    title?: string;
    description?: string;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // 少なくとも1つのパラメータがあるか確認
      if (args.title === undefined && args.description === undefined) {
        throw new Error('更新すべき項目（タイトルまたは説明）を少なくとも1つ指定してください');
      }

      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // フォーム情報を更新
      const result = await service.updateFormInfo(
        formId,
        args.title,
        args.description
      );

      // 更新内容のメッセージを作成
      let message = "フォーム情報を更新しました: ";
      const updates: string[] = [];

      if (args.title !== undefined) {
        updates.push(`タイトル「${args.title}」`);
      }

      if (args.description !== undefined) {
        updates.push(`説明「${args.description}」`);
      }

      message += updates.join('、');

      return {
        content: [
          {
            type: "text",
            text: message,
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
