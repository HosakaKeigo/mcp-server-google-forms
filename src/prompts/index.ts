import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IMCPPrompt } from "../types/index.js";
import { CreateQuizPrompt } from "./create-quiz.js";

export function registerPrompts(server: McpServer): void {
  const Prompts: IMCPPrompt[] = [new CreateQuizPrompt()];

  for (const prompt of Prompts) {
    server.prompt(prompt.name, prompt.handler.bind(prompt));
  }
}
