# E2E テスト実行ガイド

## セットアップ

Playwright を使用した E2E テストが設定されました。

### インストール

```bash
npm install -D @playwright/test
```

### ブラウザの認識

```bash
npx playwright install
```

## テスト実行

### すべてのテストを実行

```bash
npm run e2e
```

### Playwright UI mode で実行（対話的）

```bash
npm run e2e:ui
```

### デバッグモードで実行

```bash
npm run e2e:debug
```

### 特定のファイルのテストを実行

```bash
npx playwright test e2e/auth-flow.spec.ts
```

### 特定のテストを実行

```bash
npx playwright test -g "should load login page"
```

### テストリストを表示

```bash
npx playwright test --list
```

## テスト構成

### ファイル構成

- `e2e/auth-flow.spec.ts` - ログインフロー関連テスト（15 テスト）
- `e2e/api-integration.spec.ts` - API インタラクション テスト（11 テスト）
- `e2e/ui-components.spec.ts` - UI コンポーネント テスト（16 テスト）

**合計: 120 テスト（3 つのブラウザエンジン × 40 テスト）**

### テストの種類

#### 認証フロー (auth-flow.spec.ts)
- ログインページ読み込み
- メール検証
- ページタイトル確認
- Google ログインボタン表示
- メール入力送信
- セッション維持
- レスポンシブデザイン（モバイル、タブレット、デスクトップ）
- エラーハンドリング

#### API インタラクション (api-integration.spec.ts)
- API リクエスト処理
- フォーム送信検証
- ネットワークアクティビティ追跡
- ネットワークエラーハンドリング
- コンテンツ表示
- localStorage / sessionStorage
- ページパフォーマンス測定
- メタデータ確認

#### UI コンポーネント (ui-components.spec.ts)
- ログインフォームレンダリング
- クリック可能なボタン
- フォームラベル表示
- セマンティック HTML
- ヘッダー要素
- キーボードナビゲーション
- フォーカス可能要素
- JavaScript エラーハンドリング
- アクセシビリティ対応
- ブラウザ戻るボタン対応
- レスポンシブ画像
- フォーカス可視スタイル

## 設定ファイル

### playwright.config.ts

- **テストディレクトリ**: `./e2e`
- **タイムアウト**: デフォルト設定
- **レポート**: HTML レポート
- **スクリーンショット**: 失敗時のみ
- **ブラウザ**: Chromium, Firefox, WebKit
- **ベース URL**: `http://localhost:3000`

## 開発サーバー起動

E2E テストを実行する前に、開発サーバーを起動してください：

```bash
npm run dev
```

Playwright の設定により、E2E テスト実行時に自動で開発サーバーが起動します。

## CI/CD での実行

環境変数 `CI=true` を設定すると、CI モードで実行されます：

```bash
CI=true npm run e2e
```

- テスト再試行: 2 回
- ワーカー数: 1（順序実行）
- 既存サーバー再利用: 無効

## 出力と結果

- **HTML レポート**: `playwright-report/index.html`
- **トレース**: テスト失敗時に自動保存
- **スクリーンショット**: テスト失敗時に保存

HTML レポートを開く：

```bash
npx playwright show-report
```

## トラブルシューティング

### ブラウザが見つからない

```bash
npx playwright install
```

### ポート 3000 が使用中

別のポートで開発サーバーを起動し、`playwright.config.ts` の `baseURL` を更新してください。

### テストがタイムアウト

ネットワーク接続を確認し、開発サーバーが正常に起動しているか確認してください。

## ベストプラクティス

1. **ローカルテスト**: `npm run e2e` で実行
2. **デバッグ**: `npm run e2e:debug` で対話的にテスト
3. **UI テスト**: `npm run e2e:ui` で視覚的にテスト確認
4. **CI/CD**: GitHub Actions などで自動実行

## 関連する Jest ユニットテスト

- 単体テスト: `npm test`
- カバレッジ: `npm run test:coverage`
- Watch モード: `npm test:watch`

現在のテスト状況：
- Jest ユニットテスト: 174 テスト合格
- route.ts カバレッジ: 89.61%
- Playwright E2E テスト: 120 テスト（セットアップ完了）
