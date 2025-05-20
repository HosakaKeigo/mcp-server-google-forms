import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";
//import { registerPrompts } from "./prompts/index.js";
//import { registerResources } from "./resources/index.js";
import { checkEnvironmentVariables } from "./utils/auth.js";

/**
 * MCP サーバーのメイン関数
 */
async function main() {
  // 環境変数の確認
  const { isValid, missingVars } = checkEnvironmentVariables();
  if (!isValid) {
    console.error(`環境変数が不足しています: ${missingVars.join(", ")}`);
    console.error(".env ファイルに必要な環境変数を設定してください");
    process.exit(1);
  }

  // MCP サーバーの作成
  const server = new McpServer({
    name: "google-forms",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  });

  // ツール、プロンプト、リソースの登録
  registerTools(server);
  //registerPrompts(server);
  //registerResources(server);

  // stdio 通信を設定
  const transport = new StdioServerTransport();

  // サーバー起動のログ
  console.error("Google Forms MCP サーバーを起動しています...");

  try {
    // サーバーの接続を確立
    await server.connect(transport);
    console.error("MCP サーバーが正常に起動しました");
  } catch (error) {
    console.error("MCP サーバーの起動中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// アプリケーションの実行
main().catch((error) => {
  console.error("予期しないエラーが発生しました:", error);
  process.exit(1);
});