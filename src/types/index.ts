import { z } from "zod";

/**
 * フォームIDの型定義
 */
export const FormIdSchema = z.string().min(1);

/**
 * フォームURLの型定義
 */
export const FormUrlSchema = z.string().url();
