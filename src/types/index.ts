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
 * Google Forms APIのエラーレスポンス
 */
export interface GoogleApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * BatchUpdateFormRequestの型定義
 */
export interface BatchUpdateFormRequest {
  requests: Array<{
    updateFormInfo?: {
      info: {
        title?: string;
        description?: string;
      };
      updateMask?: string;
    };
    updateItem?: {
      item: Record<string, any>;
      location: {
        index: number;
      };
      updateMask: string;
    };
    createItem?: {
      item: Record<string, any>;
      location: {
        index: number;
      };
    };
    deleteItem?: {
      location: {
        index: number;
      };
    };
  }>;
  includeFormInResponse?: boolean;
}
