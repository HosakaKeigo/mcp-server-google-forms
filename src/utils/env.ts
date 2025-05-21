import "dotenv/config";

/**
 * Check if required environment variables are set
 * @returns Object representing the status of environment variables
 */
export function checkEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ["GOOGLE_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
