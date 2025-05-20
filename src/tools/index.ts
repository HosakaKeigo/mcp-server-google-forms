import { GetFormTool } from "./get-form.js";
import { AddTextItemTool } from "./add-text-item.js";
import { AddQuestionItemTool } from "./add-question-item.js";
import { MoveItemTool } from "./move-item.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * すべてのツールをサーバーに登録する
 * @param server MCPサーバーインスタンス
 */
export function registerTools(server: McpServer): void {
  const getFormTool = new GetFormTool();
  const addTextItemTool = new AddTextItemTool();
  const addQuestionItemTool = new AddQuestionItemTool();
  const moveItemTool = new MoveItemTool();
  //const updateFormTool = new UpdateFormTool();

  server.tool(
    getFormTool.name,
    getFormTool.description,
    getFormTool.parameters,
    getFormTool.execute.bind(getFormTool)
  );

  server.tool(
    addTextItemTool.name,
    addTextItemTool.description,
    addTextItemTool.parameters,
    addTextItemTool.execute.bind(addTextItemTool)
  );

  server.tool(
    addQuestionItemTool.name,
    addQuestionItemTool.description,
    addQuestionItemTool.parameters,
    addQuestionItemTool.execute.bind(addQuestionItemTool)
  );

  server.tool(
    moveItemTool.name,
    moveItemTool.description,
    moveItemTool.parameters,
    moveItemTool.execute.bind(moveItemTool)
  );

  //server.tool(
  //  updateFormTool.name,
  //  updateFormTool.description,
  //  updateFormTool.parameters,
  //  updateFormTool.execute.bind(updateFormTool)
  //);
}