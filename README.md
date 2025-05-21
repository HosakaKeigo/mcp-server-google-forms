# Google Forms MCP Server

This is a Model Context Protocol (MCP) server for Google Forms that allows you to get and update Google Forms through Claude.

![google-forms-mcp-demo](https://github.com/user-attachments/assets/7a62025f-3f02-4471-aed8-6d4a5e1edf86)


## Prerequisites

- Node.js 20 or higher
- A Google Cloud project

## Setup

1. **Enable the Google Forms API:**
   - Go to the [Google Cloud Console API Library](https://console.cloud.google.com/apis/library).
   - Search for "Google Forms API".
   - Select the API and click "Enable".

2. **Configure Application Default Credentials (ADC):**
   You have two main options for authenticating the server:

   **a) Using `gcloud` (recommended for local development):**
      - Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
      - Log in with your user credentials. By default, `gcloud auth application-default login` requests the following scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/cloud-platform`, and `https://www.googleapis.com/auth/sqlservice.login`.
      - For this project, you **must** explicitly provide the necessary scopes for accessing Google Forms and Google Drive by using the `--scopes` flag. These will be requested in addition to the defaults (or will replace them if the gcloud version behavior is to override). The required scopes are:
        ```bash
        gcloud auth application-default login --scopes=https://www.googleapis.com/auth/forms,https://www.googleapis.com/auth/drive,openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform
        ```
        The `drive.file` scope is necessary for creating new forms, as they are stored in Google Drive. The `openid` and `userinfo.email` scopes are commonly included for user authentication context, and `cloud-platform` provides broad access to GCP services which might be useful if the ADC is used for other gcloud operations.
      - This command will open a browser window for you to authenticate. Once done, your ADC will be configured.
      - Ensure your `GOOGLE_PROJECT_ID` is set in your environment (see step 5). The server will use this project.

   **b) Using a Service Account (suitable for production or automated environments):**
      - Create a service account and download its key file (JSON). For more details, see [Google Cloud Authentication documentation](https://cloud.google.com/docs/authentication/production).
      - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of this JSON key file (see step 5).
      - Ensure the service account has the necessary IAM permissions (e.g., "Forms Editor" or a custom role with equivalent permissions) and that the Forms API is enabled for your project.

3. **Clone this repository:**
   ```bash
   git clone <repository-url> # Replace <repository-url> with the actual URL
   cd <repository-name>      # Replace <repository-name> with the cloned directory name
   ```

4. **Install dependencies:**
   ```
   pnpm install
   ```

5. **Configure environment variables:**
   ```
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `GOOGLE_PROJECT_ID`: Your Google Cloud project ID. This is required for both ADC methods.
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account key file.

6. **Build the server:**
   ```
   pnpm build
   ```

## Usage

Start the server:

```
pnpm start
```

You can then configure your MCP client (e.g., Claude Desktop) to use this server.

### Available Tools

- `get_form`: Get the structure of a Google Form
- `add_text_item`: Add a text item (title and description only) to a form
- `add_question_item`: Add a question item (text input, multiple choice, etc.) to a form
- `move_item`: Move an item to a different position within the form
- `update_form_info`: Update the form's basic information (title and description)
- `delete_item`: Delete an item from the form
- `add_page_break_item`: Add a page break to a form
- `add_question_group_item`: Add a question group (including grid questions) to a form
- `update_settings`: Update form settings like email collection, quiz settings, etc.
- `create_form`: Create a new Google Form
- `update_item`: Update an existing item in a form
- `batch_update_form`: Perform multiple operations on a form in a single request

### Available Prompts
Not implemented yet.

### Available Resources
Not implemented yet.

## License

MIT
