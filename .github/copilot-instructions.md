# プロジェクト概要
TypeScriptで書かれたGoogle Forms MCP Server。

## Structure
### /src/index.ts
エントリーポイント。ツールの登録やサーバー起動を行う。

### /src/tools
ツールの定義。classベースで定義される。実装の際は既存の実装をチェックすること。

### /src/utils/api.ts
Google Forms APIを操作するためのサービスクラス `GFormService` の実装。すべてのフォーム操作の実装はこのファイルに集約される。

## 実装上の注意
### Google Forms API
`@googleapis/forms` node.jsクライアントライブラリを使用している。
Schemaは`/node_modules/@googleapis/forms/build/v1.d.ts`に定義されている。（不明な場合はユーザーに求めること）

### ツールの定義
- ツールはclassベースで定義すること。`parameters`はZodによるバリデーションを行う。
- src/tools/index.tsでの登録を忘れないこと。

### 機能拡張のガイドライン
1. 新しい機能を追加する場合:
   - 適切なツールクラスを`src/tools/`に作成する
   - 必要なサービスメソッドを`GFormService`クラスに追加する
   - `src/tools/index.ts`でツールを登録する

2. APIの変更に対応する場合:
   - まず`/node_modules/@googleapis/forms/build/v1.d.ts`で最新のスキーマを確認する
   - 変更に応じてツールパラメータとサービスメソッドを更新する