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

/**
 * Google APIの認証情報を取得する
 * @returns 認証情報を含むオブジェクト
 */
export function getAuthConfig(): { projectId: string; credentialsPath: string } {
  const { isValid, missingVars } = checkEnvironmentVariables();
  
  if (!isValid) {
    throw new Error(
      `認証に必要な環境変数が設定されていません: ${missingVars.join(", ")}`
    );
  }
  
  return {
    projectId: process.env.GOOGLE_PROJECT_ID!,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
  };
}