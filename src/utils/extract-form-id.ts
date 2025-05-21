import { URL } from "node:url";

/**
 * Extract form ID from Google Forms URL
 * @param formUrl Google Forms URL
 * @returns Extracted form ID
 */
export function extractFormId(formUrl: string): string {
  try {
    const url = new URL(formUrl);

    // 編集URLの形式: https://docs.google.com/forms/d/e/{formId}/edit
    if (url.pathname.includes("/forms/d/e/")) {
      const pathParts = url.pathname.split("/");
      const formIdIndex = pathParts.findIndex((part) => part === "e") + 1;
      if (formIdIndex > 0 && formIdIndex < pathParts.length) {
        return pathParts[formIdIndex];
      }
    }

    // 通常のURL形式: https://docs.google.com/forms/d/{formId}/edit
    if (url.pathname.includes("/forms/d/")) {
      const pathParts = url.pathname.split("/");
      const formIdIndex = pathParts.findIndex((part) => part === "d") + 1;
      if (formIdIndex > 0 && formIdIndex < pathParts.length) {
        return pathParts[formIdIndex];
      }
    }

    throw new Error("Form ID not found");
  } catch (error) {
    throw new Error(
      `Error parsing form URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
