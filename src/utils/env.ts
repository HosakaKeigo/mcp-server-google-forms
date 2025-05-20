import "dotenv/config";

/**
 * 必要な環境変数が設定されているか確認する
 * @returns 環境変数の状態を表すオブジェクト
 */
export function checkEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ["GOOGLE_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
