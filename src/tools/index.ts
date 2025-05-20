import { GetFormTool } from "./get-form.js";
import { AddTextItemTool } from "./add-text-item.js";
import { AddQuestionItemTool } from "./add-question-item.js";
import { MoveItemTool } from "./move-item.js";
import { UpdateFormInfoTool } from "./update-form-info.js";
import { DeleteItemTool } from "./delete-item.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * すべてのツールをサーバーに登録する
 * @param server MCPサーバーインスタンス
 */
export function registerTools(server: McpServer): void {
  const tools = [
    new GetFormTool(),
    new AddTextItemTool(),
    new AddQuestionItemTool(),
    new MoveItemTool(),
    new UpdateFormInfoTool(),
    new DeleteItemTool(),
  ];

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.parameters,
      tool.execute.bind(tool)
    );
  }
}
