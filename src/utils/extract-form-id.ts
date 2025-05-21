import { URL } from "node:url";

/**
 * Extract form ID from Google Forms URL
 * @param formUrl Google Forms URL
 * @returns Extracted form ID
 * @throws Error if the URL is invalid, not a Google Forms URL, or the form ID cannot be found.
 */
export function extractFormId(formUrl: string): string {
  try {
    const url = new URL(formUrl);

    // Check if it's a Google Forms URL
    if (url.hostname !== 'docs.google.com' || !url.pathname.startsWith('/forms/d/')) {
      throw new Error('Invalid Google Forms URL');
    }

    const pathParts = url.pathname.split('/');
    // pathParts for /forms/d/e/{formId}/... will be ['', 'forms', 'd', 'e', '{formId}', ...]
    // pathParts for /forms/d/{formId}/... will be ['', 'forms', 'd', '{formId}', ...]

    let formId: string | undefined;

    // Check for /d/e/{formId} pattern
    if (pathParts[3] === 'e') {
      if (pathParts.length > 4 && pathParts[4]) {
        formId = pathParts[4];
      }
    }
    // Check for /d/{formId} pattern
    else if (pathParts[3] && pathParts[3] !== 'e') {
      // Make sure pathParts[3] is not an empty string and is not 'e'
      formId = pathParts[3];
    }

    if (!formId) {
      throw new Error('Form ID not found in URL path');
    }

    // Basic check to ensure formId is not something like 'edit' or 'viewform' if the path is too short
    if (formId === 'edit' || formId === 'viewform') {
      throw new Error('Form ID not found in URL path');
    }

    return formId;

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      // Re-throw TypeError for invalid URLs with a specific message format
      throw new Error('Error parsing form URL: Invalid URL');
    }
    // For other errors, including the custom ones thrown above
    throw new Error(
      `Error parsing form URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
