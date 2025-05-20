import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * フォームに質問項目を追加するMCPツール
 */
export class AddQuestionItemTool {
  /**
   * ツール名
   */
  readonly name = "add_question_item";

  /**
   * ツールの説明
   */
  readonly description =
    "Google Formsに質問項目を追加します。テキスト型や選択式の質問を作成できます。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("質問のタイトル"),
    question_type: z
      .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
      .describe(
        "質問タイプ（TEXT:短文テキスト, PARAGRAPH_TEXT:長文テキスト, RADIO:ラジオボタン, CHECKBOX:チェックボックス, DROP_DOWN:ドロップダウン）",
      ),
    options: z.array(z.string()).optional().describe("選択肢（RADIO, CHECKBOX, DROP_DOWN"),
    required: z.boolean().optional().default(false).describe("必須かどうか（省略時はfalse）"),
    include_other: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "「その他」オプションを含めるかどうか（RADIO, CHECKBOXの場合のみ有効、省略時はfalse）",
      ),
    index: z.number().optional().describe("挿入位置（省略時は末尾）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    title: string;
    question_type: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";
    options?: string[];
    required?: boolean;
    include_other?: boolean;
    index?: number;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // 選択式の質問の場合、選択肢が必要
      if (
        (args.question_type === "RADIO" ||
          args.question_type === "CHECKBOX" ||
          args.question_type === "DROP_DOWN") &&
        (!args.options || args.options.length === 0)
      ) {
        throw new Error(`${args.question_type}タイプの質問には選択肢が必要です`);
      }

      // サービスのインスタンス化
      const service = new GFormService();

      // 質問項目を追加
      await service.addQuestionItem(
        formId,
        args.title,
        args.question_type,
        args.options,
        args.required,
        args.include_other,
        args.index,
      );

      // 質問タイプを日本語に変換
      const questionTypeMap = {
        TEXT: "短文テキスト",
        PARAGRAPH_TEXT: "長文テキスト",
        RADIO: "ラジオボタン",
        CHECKBOX: "チェックボックス",
        DROP_DOWN: "ドロップダウン",
      };

      return {
        content: [
          {
            type: "text",
            text: `質問項目 "${args.title}" (${questionTypeMap[args.question_type]}) をフォームに追加しました。${
              args.required ? "（必須回答）" : ""
            }${
              args.include_other &&
              (args.question_type === "RADIO" || args.question_type === "CHECKBOX")
                ? "（「その他」オプション付き）"
                : ""
            }`,
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
