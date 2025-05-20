# Google Forms MCP Server

This is a Model Context Protocol (MCP) server for Google Forms that allows you to get and update Google Forms through Claude.

## Prerequisites

- Node.js 16 or higher
- Google Cloud project with Google Forms API enabled
- Application Default Credentials configured

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `GOOGLE_PROJECT_ID`: Your Google Cloud project ID
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account key file

4. Build the server:
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