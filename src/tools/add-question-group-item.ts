import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * フォームに質問グループ（グリッド）を追加するMCPツール
 */
export class AddQuestionGroupItemTool {
  /**
   * ツール名
   */
  readonly name = "add_question_group_item";

  /**
   * ツールの説明
   */
  readonly description =
    "Google Formsに質問グループ（複数の質問を一つのセクションにまとめたもの、グリッド形式も対応）を追加します。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    title: z.string().describe("質問グループのタイトル"),
    rows: z
      .array(
        z.object({
          title: z.string().describe("質問（行）のタイトル"),
          required: z.boolean().optional().describe("必須かどうか（省略時はfalse）"),
        }),
      )
      .min(1)
      .describe("質問（行）のリスト"),
    is_grid: z.boolean().default(false).describe("グリッド形式かどうか（省略時はfalse）"),
    grid_type: z
      .enum(["CHECKBOX", "RADIO"])
      .optional()
      .describe("グリッド形式の場合の選択タイプ（チェックボックスまたはラジオボタン）"),
    columns: z.array(z.string()).optional().describe("グリッド形式の場合の列（選択肢）"),
    shuffle_questions: z
      .boolean()
      .optional()
      .describe("質問をランダムに並べ替えるかどうか（省略時はfalse）"),
    description: z.string().optional().describe("質問グループの説明（省略可）"),
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
    rows: { title: string; required?: boolean }[];
    is_grid?: boolean;
    grid_type?: "CHECKBOX" | "RADIO";
    columns?: string[];
    shuffle_questions?: boolean;
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
          throw new Error(
            `インデックス ${args.index} が範囲外です。フォームには ${maxIndex} 個の項目があります。有効な範囲は 0～${maxIndex} です。`,
          );
        }
      }

      // グリッド形式のバリデーション
      if (args.is_grid) {
        if (!args.columns || args.columns.length === 0) {
          throw new Error("グリッド形式の質問グループには列（選択肢）が必要です");
        }
        if (!args.grid_type) {
          throw new Error(
            "グリッド形式の質問グループには選択タイプ（CHECKBOX または RADIO）が必要です",
          );
        }
      }

      // 質問グループを追加
      const index = args.index !== undefined ? args.index : 0;
      const result = await service.addQuestionGroupItem(
        formId,
        args.title,
        args.rows,
        args.is_grid,
        args.columns,
        args.grid_type,
        args.shuffle_questions,
        args.description,
        index,
      );

      const indexText =
        index === 0
          ? "先頭"
          : form.items && index >= form.items.length
            ? "末尾"
            : `インデックス ${index}`;

      const gridText = args.is_grid
        ? `グリッド形式（${args.grid_type === "CHECKBOX" ? "チェックボックス" : "ラジオボタン"}）`
        : "通常形式";

      return {
        content: [
          {
            type: "text",
            text:
              `フォームに質問グループ「${args.title}」を${indexText}に追加しました。` +
              `\n- 形式: ${gridText}` +
              `\n- 質問数: ${args.rows.length}個` +
              `\n\n変更後のフォーム情報:\n${JSON.stringify(result.form, null, 2)}`,
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
