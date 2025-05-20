import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { InferZodParams } from "../types/index.js";
import { GFormService } from "../utils/api.js";

/**
 * 新しいGoogleフォームを作成するMCPツール
 */
export class CreateFormTool {
  /**
   * ツール名
   */
  readonly name = "create_form";

  /**
   * ツールの説明
   */
  readonly description = "新しいGoogleフォームを作成します。タイトルのみを指定できます。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    title: z.string().describe("フォームのタイトル"),
    document_title: z
      .string()
      .optional()
      .describe("ドキュメントのタイトル（省略時はフォームのタイトルと同じ）"),
    unpublished: z
      .boolean()
      .optional()
      .default(false)
      .describe("公開しないかどうか（trueの場合は回答を受け付けない、デフォルトはfalse）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // サービスのインスタンス化
      const service = new GFormService();

      // フォームを作成
      const result = await service.createForm(args.title, args.document_title, args.unpublished);

      // フォームURLの作成
      let formUrl = "";
      if (result.formId) {
        formUrl = `https://docs.google.com/forms/d/e/${result.formId}/edit`;
      }

      return {
        content: [
          {
            type: "text",
            text: `フォームを作成しました。\nタイトル: ${args.title}\nフォームID: ${result.formId}\nURL: ${formUrl}`,
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
