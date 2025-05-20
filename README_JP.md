# Google Forms MCP サーバー

このリポジトリは、Google FormsのMCP（Model Context Protocol）サーバーです。ClaudeからGoogle Formsの取得と更新を可能にします。

## 必要条件

- Node.js 16以上
- Google Forms APIが有効化されたGoogle Cloudプロジェクト
- Application Default Credentialsの設定

## セットアップ

1. このリポジトリをクローンします
2. 依存関係をインストールします:
   ```
   pnpm install
   ```
3. 環境変数を設定します:
   ```
   cp .env.example .env
   ```
   `.env`ファイルを編集して以下を設定します:
   - `GOOGLE_PROJECT_ID`: Google CloudプロジェクトID
   - `GOOGLE_APPLICATION_CREDENTIALS`: サービスアカウントキーファイルへのパス

4. サーバーをビルドします:
   ```
   pnpm build
   ```

## 使用方法

サーバーを起動します:

```
pnpm start
```

その後、MCP対応のクライアント（Claude Desktopなど）でこのサーバーを使用できます。

### 利用可能なツール

- `get_form`: Google Formsの構造を取得
- `update_form`: バッチ更新リクエストでGoogle Formsを更新

### 利用可能なプロンプト

- `edit_form`: Google Forms編集のためのガイド付きプロンプト

## ライセンス

MIT