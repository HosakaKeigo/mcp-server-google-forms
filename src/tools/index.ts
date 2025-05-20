import { GetFormTool } from "./get-form.js";
import { UpdateFormTool } from "./update-form.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * すべてのツールをサーバーに登録する
 * @param server MCPサーバーインスタンス
 */
export function registerTools(server: McpServer): void {
  const getFormTool = new GetFormTool();
  //const updateFormTool = new UpdateFormTool();

  server.tool(
    getFormTool.name,
    getFormTool.description,
    getFormTool.parameters,
    getFormTool.execute.bind(getFormTool)
  );

  //server.tool(
  //  updateFormTool.name,
  //  updateFormTool.description,
  //  updateFormTool.parameters,
  //  updateFormTool.execute.bind(updateFormTool)
  //);
}