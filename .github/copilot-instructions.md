# プロジェクト概要
TypeScriptで書かれたGoogle Forms MCP Server。

## Structure
### /src/index.ts
エントリーポイント。ツールの登録やサーバー起動を行う。

### /src/tools
ツールの定義。classベースで定義される。実装の際は既存の実装をチェックすること。

## 実装上の注意
### Google Forms API
`@googleapis/forms` node.jsクライアントライブラリを使用している。
Schemaは`/node_modules/@googleapis/forms/build/v1.d.ts`に定義されている。（不明な場合はユーザーに求めること）

### ツールの定義
- ツールはclassベースで定義すること。`parameters`はZodによるバリデーションを行う。
- src/tools/index.tsでの登録を忘れないこと。