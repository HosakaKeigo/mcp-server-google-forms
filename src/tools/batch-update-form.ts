import type { forms_v1 } from "@googleapis/forms";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";
import {
  buildCreateItemRequest,
  buildDeleteItemRequest,
  buildMoveItemRequest,
  buildUpdateFormInfoRequest,
  buildUpdateItemRequest,
} from "../utils/request-builders.js";

/**
 * フォームの複数の項目を一括更新するMCPツール
 */
export class BatchUpdateFormTool {
  /**
   * ツール名
   */
  readonly name = "batch_update_form";

  /**
   * ツールの説明
   */
  readonly description =
    "Google Formsの複数の更新操作を一括で実行します。項目の追加・更新・削除・移動などを一度に行えます。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    operations: z
      .array(
        z.object({
          // 操作タイプ
          operation: z
            .enum(["create_item", "update_item", "delete_item", "move_item", "update_form_info"])
            .describe("実行する操作のタイプ"),

          // 共通パラメータ
          index: z.number().optional().describe("操作対象の項目インデックス（必要な場合）"),

          // 項目作成・更新用パラメータ
          title: z.string().optional().describe("項目のタイトル"),
          description: z.string().optional().describe("項目の説明"),

          // 項目タイプ情報（create_item用）
          item_type: z
            .enum(["text", "question", "pageBreak", "questionGroup"])
            .optional()
            .describe("作成する項目のタイプ（create_item時に必要）"),

          // 質問タイプ情報（質問作成時）
          question_type: z
            .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
            .optional()
            .describe("質問のタイプ（item_typeがquestionの場合）"),
          options: z.array(z.string()).optional().describe("選択肢のリスト（選択式質問の場合）"),
          required: z.boolean().optional().describe("質問が必須かどうか"),
          include_other: z
            .boolean()
            .optional()
            .describe("「その他」オプションを含めるか（選択式質問の場合）"),

          // 移動用パラメータ
          new_index: z.number().optional().describe("移動先のインデックス（move_item時に必要）"),
        }),
      )
      .describe("実行する操作のリスト"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    operations: {
      operation: "create_item" | "update_item" | "delete_item" | "move_item" | "update_form_info";
      index?: number;
      title?: string;
      description?: string;
      item_type?: "text" | "question" | "pageBreak" | "questionGroup";
      question_type?: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";
      options?: string[];
      required?: boolean;
      include_other?: boolean;
      new_index?: number;
    }[];
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // フォーム情報を取得（インデックスの検証など）
      const form = await service.getForm(formId);
      if (!form) {
        throw new Error("フォームが見つかりませんでした。");
      }

      // リクエストの準備
      const requests: forms_v1.Schema$Request[] = [];

      // 各操作をリクエストに変換
      for (const [opIndex, op] of args.operations.entries()) {
        try {
          let request: forms_v1.Schema$Request | Error | undefined;
          switch (op.operation) {
            case "create_item": {
              if (!op.item_type) {
                throw new Error(`操作 #${opIndex + 1}: 項目作成時はitem_typeが必須です`);
              }
              if (!op.title) {
                throw new Error(`操作 #${opIndex + 1}: 項目作成時はtitleが必須です`);
              }
              request = buildCreateItemRequest({
                title: op.title,
                description: op.description,
                index: op.index ?? form.items?.length ?? 0,
                itemType: op.item_type,
                questionType: op.question_type,
                options: op.options,
                required: op.required,
                includeOther: op.include_other,
              });
              break;
            }
            case "update_item": {
              if (op.index === undefined) {
                throw new Error(`操作 #${opIndex + 1}: 項目更新時はindexが必須です`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`操作 #${opIndex + 1}: インデックス ${op.index} が範囲外です`);
              }
              const currentItem = form.items[op.index];
              request = buildUpdateItemRequest(
                {
                  index: op.index,
                  title: op.title,
                  description: op.description,
                  required: op.required,
                },
                currentItem,
              );
              break;
            }
            case "delete_item": {
              if (op.index === undefined) {
                throw new Error(`操作 #${opIndex + 1}: 項目削除時はindexが必須です`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`操作 #${opIndex + 1}: インデックス ${op.index} が範囲外です`);
              }
              request = buildDeleteItemRequest({ index: op.index });
              break;
            }
            case "move_item": {
              if (op.index === undefined) {
                throw new Error(`操作 #${opIndex + 1}: 項目移動時はindexが必須です`);
              }
              if (op.new_index === undefined) {
                throw new Error(`操作 #${opIndex + 1}: 項目移動時はnew_indexが必須です`);
              }
              if (op.index < 0 || !form.items || op.index >= form.items.length) {
                throw new Error(`操作 #${opIndex + 1}: インデックス ${op.index} が範囲外です`);
              }
              if (op.new_index < 0 || op.new_index > form.items.length) {
                throw new Error(
                  `操作 #${opIndex + 1}: 新しいインデックス ${op.new_index} が範囲外です`,
                );
              }
              request = buildMoveItemRequest({ index: op.index, newIndex: op.new_index });
              break;
            }
            case "update_form_info": {
              request = buildUpdateFormInfoRequest({
                title: op.title,
                description: op.description,
              });
              break;
            }
            default:
              throw new Error(`操作 #${opIndex + 1}: 不明な操作タイプ: ${op.operation}`);
          }
          if (request instanceof Error) {
            throw new Error(`操作 #${opIndex + 1}: ${request.message}`);
          }
          requests.push(request);
        } catch (error) {
          throw new Error(
            `操作 #${opIndex + 1}でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // リクエストが空の場合はエラー
      if (requests.length === 0) {
        throw new Error("実行する操作がありません");
      }

      // バッチ更新を実行
      const result = await service.batchUpdateForm(formId, requests);

      return {
        content: [
          {
            type: "text",
            text: `${requests.length}件の操作を一括実行しました。

操作内容:
${args.operations.map((op, i) => `${i + 1}. ${this.formatOperation(op)}`).join("\n")}

現在のフォームには ${result.form?.items?.length ?? 0} 個の項目があります。`,
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

  /**
   * 操作内容を人間が読みやすい形式にフォーマットする
   * @param op 操作オブジェクト
   * @returns フォーマットされた操作の説明
   */
  private formatOperation(op: {
    operation: string;
    index?: number;
    title?: string;
    description?: string;
    item_type?: string;
    question_type?: string;
    options?: string[];
    required?: boolean;
    include_other?: boolean;
    new_index?: number;
  }): string {
    switch (op.operation) {
      case "create_item":
        return `項目作成: タイプ=${op.item_type}, タイトル="${op.title}"${op.index !== undefined ? `, 位置=${op.index}` : ""}`;

      case "update_item": {
        const updates: string[] = [];
        if (op.title !== undefined) updates.push(`タイトル="${op.title}"`);
        if (op.description !== undefined) updates.push(`説明="${op.description}"`);
        if (op.required !== undefined) updates.push(`必須=${op.required}`);
        return `項目更新: インデックス=${op.index}, 更新内容: ${updates.join(", ")}`;
      }

      case "delete_item":
        return `項目削除: インデックス=${op.index}`;

      case "move_item":
        return `項目移動: インデックス=${op.index} → ${op.new_index}`;

      case "update_form_info": {
        const updates: string[] = [];
        if (op.title !== undefined) updates.push(`タイトル="${op.title}"`);
        if (op.description !== undefined) updates.push(`説明="${op.description}"`);
        return `フォーム情報更新: ${updates.join(", ")}`;
      }

      default:
        return `不明な操作: ${op.operation}`;
    }
  }
}
