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
- `update_form`: Update a Google Form with a batch update request

### Available Prompts

- `edit_form`: Guided prompt for editing Google Forms

## License

MIT