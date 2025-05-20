import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * フォームを取得するMCPツール
 */
export class GetFormTool {
  /**
   * ツール名
   */
  readonly name = "get_form";

  /**
   * ツールの説明
   */
  readonly description =
    "Google Formsの構造を取得します。編集するための準備として利用してください。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: { form_url: string }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // フォーム情報を取得
      const form = new GFormService();
      const formData = await form.getForm(formId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formData, null, 2),
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
