import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IMCPTool } from "../types/index.js";
import { BatchUpdateFormTool } from "./batch-update-form.js";
import { CreateFormTool } from "./create-form.js";
import { GetFormTool } from "./get-form.js";

/**
 * Register all tools to the server
 * @param server MCP server instance
 */
export function registerTools(server: McpServer): void {
  const tools: IMCPTool[] = [
    new GetFormTool(),
    new CreateFormTool(),
    new BatchUpdateFormTool(),
  ];

  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.parameters, tool.execute.bind(tool));
  }
}
