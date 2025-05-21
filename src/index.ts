import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPrompts } from "./prompts/index.js";
import { registerTools } from "./tools/index.js";
//import { registerPrompts } from "./prompts/index.js";
//import { registerResources } from "./resources/index.js";
import { checkEnvironmentVariables } from "./utils/env.js";

/**
 * Main function for the MCP server
 */
async function main() {
  // Check environment variables
  const { isValid, missingVars } = checkEnvironmentVariables();
  if (!isValid) {
    console.error(`Missing environment variables: ${missingVars.join(", ")}`);
    console.error("Please set the required environment variables in the .env file");
    process.exit(1);
  }

  // Create MCP server
  const server = new McpServer({
    name: "google-forms",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  });

  // Register tools, prompts, and resources
  registerTools(server);
  registerPrompts(server);
  //registerResources(server);

  // Set up stdio communication
  const transport = new StdioServerTransport();

  // Log server startup
  console.error("Starting Google Forms MCP Server...");

  try {
    // Establish server connection
    await server.connect(transport);
    console.error("MCP Server started successfully");
  } catch (error) {
    console.error("Error occurred while starting MCP Server:", error);
    process.exit(1);
  }
}

// Run application
main().catch((error) => {
  console.error("Unexpected error occurred:", error);
  process.exit(1);
});
