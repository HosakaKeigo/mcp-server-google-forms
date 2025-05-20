import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import { FormUrlSchema } from "../types/index.js";
import { forms_v1 } from "@googleapis/forms";

/**
 * フォームの項目を更新するMCPツール
 */
export class UpdateItemTool {
  /**
   * ツール名
   */
  readonly name = "update_item";

  /**
   * ツールの説明
   */
  readonly description = "Google Formsの既存項目を更新します。項目のタイトルや説明、質問の必須設定などを変更できます。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe("Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)"),
    index: z.number().int().min(0).describe("更新する項目のインデックス（0から始まる）"),
    title: z.string().optional().describe("項目の新しいタイトル（省略可）"),
    description: z.string().optional().describe("項目の新しい説明（省略可）"),
    required: z.boolean().optional().describe("質問項目の必須設定（省略可、質問項目の場合のみ有効）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    index: number;
    title?: string;
    description?: string;
    required?: boolean;
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // フォーム情報取得（インデックスの確認と現在の項目情報取得のため）
      const form = await service.getForm(formId);

      // インデックスの範囲確認
      if (args.index < 0 || !form.items || args.index >= form.items.length) {
        throw new Error(`インデックス ${args.index} が範囲外です。フォームには ${form.items ? form.items.length : 0} 個の項目があります。`);
      }

      // 現在の項目情報を取得
      const currentItem = form.items[args.index];

      // 更新オブジェクトとupdate_maskの作成
      const item: forms_v1.Schema$Item = {};
      const updateMaskParts: string[] = [];

      // タイトルの更新
      if (args.title !== undefined) {
        item.title = args.title;
        updateMaskParts.push('title');
      }

      // 説明の更新
      if (args.description !== undefined) {
        item.description = args.description;
        updateMaskParts.push('description');
      }

      // 必須設定の更新（質問項目の場合のみ）
      if (args.required !== undefined) {
        // 質問項目かどうかチェック
        if (currentItem.questionItem) {
          if (!item.questionItem) {
            item.questionItem = {
              question: {}
            };
          }
          if (!item.questionItem.question) {
            item.questionItem.question = {};
          }
          item.questionItem.question.required = args.required;
          updateMaskParts.push('questionItem.question.required');
        } else {
          throw new Error("required パラメータは質問項目（questionItem）にのみ適用できます");
        }
      }

      // 更新すべき項目がない場合はエラー
      if (updateMaskParts.length === 0) {
        throw new Error('更新すべき項目を少なくとも1つ指定してください');
      }

      // 項目を更新
      const result = await service.updateItem(
        formId,
        args.index,
        item,
        updateMaskParts.join(',')
      );
      const currentItems = result.form?.items;

      // 更新内容のメッセージを作成
      let message = `インデックス ${args.index} の項目を更新しました: `;
      const updates: string[] = [];

      if (args.title !== undefined) {
        updates.push(`タイトル「${args.title}」`);
      }

      if (args.description !== undefined) {
        updates.push(`説明「${args.description}」`);
      }

      if (args.required !== undefined) {
        updates.push(`必須設定: ${args.required ? "有効" : "無効"}`);
      }

      message += updates.join('、');

      return {
        content: [
          {
            type: "text",
            text: message +
              `\n更新後のフォームの項目は以下の通りです：\n\n${JSON.stringify(currentItems, null, 2)}。`,
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
