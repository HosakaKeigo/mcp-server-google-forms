import { forms, type forms_v1 } from "@googleapis/forms";
import { GoogleAuth } from "google-auth-library";
import { ERROR_MESSAGES } from "../constants/errors.js";

/**
 * Service class for operating the Google Forms API
 */
export class GFormService {
  private formClient: forms_v1.Forms;

  constructor() {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/forms"],
    });
    this.formClient = forms({
      version: "v1",
      auth,
    });
  }

  /**
   * Retrieve form information from Google Forms API
   * @param formId Form ID
   * @returns Form information
   */
  async getForm(formId: string): Promise<forms_v1.Schema$Form> {
    try {
      const form = await this.formClient.forms.get({
        formId,
      });

      if (!form) {
        throw new Error(ERROR_MESSAGES.FORM_NOT_FOUND);
      }
      const formData = form.data;

      return formData;
    } catch (error) {
      console.error("Error fetching form:", error);
      throw new Error(
        `${ERROR_MESSAGES.API_ERROR}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a new form
   * @param title Form title
   * @param documentTitle Document title (same as title if omitted)
   * @param unpublished Whether the form should not be published (if true, does not accept responses)
   * @returns Form creation result
   */
  async createForm(title: string, documentTitle?: string, unpublished = false) {
    try {
      const form: forms_v1.Schema$Form = {
        info: {
          title,
        },
      };

      // Set document title (same as title if omitted)
      if (documentTitle) {
        if (!form.info) {
          form.info = {};
        }
        form.info.documentTitle = documentTitle;
      }

      const result = await this.formClient.forms.create({
        unpublished,
        requestBody: form,
      });

      return result.data;
    } catch (error) {
      throw new Error(
        `Error occurred while creating form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Perform multiple operations on a form in a batch
   * @param formId Form ID
   * @param requests Array of requests to execute
   * @returns Update result
   */
  async batchUpdateForm(formId: string, requests: forms_v1.Schema$Request[]) {
    try {
      // Error if requests array is empty
      if (requests.length === 0) {
        throw new Error("No requests to execute");
      }

      const result = await this.formClient.forms.batchUpdate({
        formId,
        requestBody: {
          requests: requests,
          includeFormInResponse: true,
        },
      });
      return result.data;
    } catch (error) {
      throw new Error(
        `Error occurred while updating form: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
