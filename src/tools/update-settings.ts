import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormUrlSchema } from "../types/index.js";
import { GFormService } from "../utils/api.js";
import { extractFormId } from "../utils/extract-form-id.js";

/**
 * フォーム設定を更新するMCPツール
 */
export class UpdateSettingsTool {
  /**
   * ツール名
   */
  readonly name = "update_settings";

  /**
   * ツールの説明
   */
  readonly description =
    "Google Formsの設定を更新します。メール収集設定やクイズ設定などを変更できます。";

  /**
   * ツールのパラメータ定義
   */
  readonly parameters = {
    form_url: FormUrlSchema.describe(
      "Google FormsのURL (例: https://docs.google.com/forms/d/e/FORM_ID/edit)",
    ),
    email_collection_type: z
      .enum(["DO_NOT_COLLECT", "VERIFIED", "RESPONDER_INPUT"])
      .optional()
      .describe(
        "メール収集タイプ（DO_NOT_COLLECT:収集しない, VERIFIED:認証済みメール, RESPONDER_INPUT:回答者が入力したメール）",
      ),
    is_quiz: z.boolean().optional().describe("クイズ形式かどうか"),
    release_grade: z
      .enum(["NONE", "IMMEDIATELY", "LATER"])
      .optional()
      .describe("成績の公開方法（NONE:公開しない, IMMEDIATELY:即時, LATER:後で）"),
  };

  /**
   * ツールの実行
   * @param args ツールの引数
   * @returns ツールの実行結果
   */
  async execute(args: {
    form_url: string;
    email_collection_type?: "DO_NOT_COLLECT" | "VERIFIED" | "RESPONDER_INPUT";
    is_quiz?: boolean;
    release_grade?: "NONE" | "IMMEDIATELY" | "LATER";
  }): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      // フォームIDを抽出
      const formId = extractFormId(args.form_url);

      // サービスのインスタンス化
      const service = new GFormService();

      // 設定オブジェクトとupdate_maskの作成
      const settings: {
        emailCollectionType?: string;
        quizSettings?: {
          isQuiz?: boolean;
          releaseGrade?: string;
        };
      } = {};

      const updateMaskParts: string[] = [];

      // メール収集設定
      if (args.email_collection_type !== undefined) {
        settings.emailCollectionType = args.email_collection_type;
        updateMaskParts.push("emailCollectionType");
      }

      // クイズ設定の処理
      if (args.is_quiz !== undefined || args.release_grade !== undefined) {
        settings.quizSettings = {};

        if (args.is_quiz !== undefined) {
          settings.quizSettings.isQuiz = args.is_quiz;
          updateMaskParts.push("quizSettings.isQuiz");
        }

        if (args.release_grade !== undefined) {
          settings.quizSettings.releaseGrade = args.release_grade;
          updateMaskParts.push("quizSettings.releaseGrade");
        }
      }

      // 更新すべき項目がない場合はエラー
      if (updateMaskParts.length === 0) {
        throw new Error("更新すべき設定項目を少なくとも1つ指定してください");
      }

      // 設定を更新
      await service.updateSettings(formId, settings, updateMaskParts.join(","));

      // 設定変更内容の説明文を生成
      const changes: string[] = [];

      if (settings.emailCollectionType) {
        const emailCollectionTypeMap = {
          EMAIL_COLLECTION_TYPE_UNSPECIFIED: "未指定",
          DO_NOT_COLLECT: "収集しない",
          VERIFIED: "認証済みメール",
          RESPONDER_INPUT: "回答者が入力したメール",
        };
        changes.push(
          `メール収集: ${emailCollectionTypeMap[settings.emailCollectionType as keyof typeof emailCollectionTypeMap]}`,
        );
      }

      if (settings.quizSettings?.isQuiz !== undefined) {
        changes.push(`クイズ形式: ${settings.quizSettings.isQuiz ? "有効" : "無効"}`);
      }

      if (settings.quizSettings?.releaseGrade) {
        const releaseGradeMap = {
          NONE: "公開しない",
          IMMEDIATELY: "即時公開",
          LATER: "後で公開",
        };
        changes.push(
          `成績公開: ${releaseGradeMap[settings.quizSettings.releaseGrade as keyof typeof releaseGradeMap]}`,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: `フォーム設定を更新しました。\n変更内容: ${changes.join(", ")}`,
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
