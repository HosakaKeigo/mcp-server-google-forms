import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IMCPTool } from "../types/index.js";
import { AddPageBreakItemTool } from "./add-page-break-item.js";
import { AddQuestionGroupItemTool } from "./add-question-group-item.js";
import { AddQuestionItemTool } from "./add-question-item.js";
import { AddTextItemTool } from "./add-text-item.js";
import { BatchUpdateFormTool } from "./batch-update-form.js";
import { CreateFormTool } from "./create-form.js";
import { DeleteItemTool } from "./delete-item.js";
import { GetFormTool } from "./get-form.js";
import { MoveItemTool } from "./move-item.js";
import { UpdateFormInfoTool } from "./update-form-info.js";
import { UpdateItemTool } from "./update-item.js";
import { UpdateSettingsTool } from "./update-settings.js";

/**
 * Register all tools to the server
 * @param server MCP server instance
 */
export function registerTools(server: McpServer): void {
  const tools: IMCPTool[] = [
    new GetFormTool(),
    new AddTextItemTool(),
    new AddQuestionItemTool(),
    new MoveItemTool(),
    new UpdateFormInfoTool(),
    new DeleteItemTool(),
    new AddPageBreakItemTool(),
    new AddQuestionGroupItemTool(),
    new UpdateSettingsTool(),
    new CreateFormTool(),
    new UpdateItemTool(),
    new BatchUpdateFormTool(),
  ];

  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.parameters, tool.execute.bind(tool));
  }
}
