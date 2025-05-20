import { z } from "zod";

/**
 * フォームIDの型定義
 */
export const FormIdSchema = z.string().min(1);

/**
 * フォームURLの型定義
 */
export const FormUrlSchema = z.string().url();

/**
 * フォーム項目のタイプ
 */
export type ItemType = "text" | "question" | "pageBreak" | "questionGroup";

/**
 * フォーム項目タイプのZodスキーマ
 */
export const ItemTypeSchema = z
  .enum(["text", "question", "pageBreak", "questionGroup"])
  .describe("作成する項目のタイプ");

/**
 * 質問のタイプ
 */
export type QuestionType = "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";

/**
 * 質問タイプのZodスキーマ
 */
export const QuestionTypeSchema = z
  .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
  .describe("質問のタイプ");

/**
 * 操作タイプ
 */
export type OperationType = "create_item" | "update_item" | "delete_item" | "move_item" | "update_form_info";

/**
 * 操作タイプのZodスキーマ
 */
export const OperationTypeSchema = z
  .enum(["create_item", "update_item", "delete_item", "move_item", "update_form_info"])
  .describe("実行する操作のタイプ");

/**
 * バッチ更新操作の型定義
 */
export type BatchUpdateOperation = {
  operation: OperationType;
  index?: number;
  title?: string;
  description?: string;
  item_type?: ItemType;
  question_type?: QuestionType;
  options?: string[];
  required?: boolean;
  include_other?: boolean;
  new_index?: number;
};
