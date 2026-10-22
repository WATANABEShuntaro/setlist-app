# セトリ記録アプリ 

ライブのセットリストを記録・管理し、あなたの参加履歴とアーティスト別ランキングを集計できるプログレッシブウェブアプリケーション（PWA）です。

## 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [インストール](#インストール)
- [セットアップ](#セットアップ)
- [開発環境](#開発環境)
- [ビルド・デプロイ](#ビルドデプロイ)
- [ディレクトリ構成](#ディレクトリ構成)
- [API・外部サービス](#api外部サービス)
- [使い方](#使い方)
- [トラブルシューティング](#トラブルシューティング)
- [よくある質問](#よくある質問)
- [ライセンス](#ライセンス)

---

## 概要

**セトリ記録アプリ**は、ライブやコンサートに参加した際のセットリスト（演奏曲目）を簡単に記録・管理できます。

### 主なメリット

- **AI画像認識**でセットリスト画像から曲を自動抽出
- **クラウド保存**でいつどこからでもアクセス可能
- **統計情報**で参加したアーティスト・曲の頻出度を可視化
- **オフライン対応** PWAでインストール可能
- **ユーザー認証**でプライベートデータを安全に管理

---

## 主な機能

### セトリ記録機能
- セットリスト画像をアップロード
- **Google Gemini API**で自動解析・曲名抽出
- 日付、公演名、会場、アーティスト情報を記録
- 手動で曲を追加・削除・並び替え可能

### セトリ管理機能
- 記録したセトリを一覧表示
- キーワード検索（アーティスト名・会場・曲名で検索）
- **アコーディオン**で詳細内容を折り畳み表示
- 各セトリの編集・削除が可能
- 全セトリ記録の一括削除機能

### ランキング・統計
- **アーティスト別ランキング**：参加したアーティスト数を集計
- **ホーム画面ダッシュボード**：
  - 参加したライブの総数
  - 異なるアーティストの数
  - 聴いた楽曲の総数
  - 直近のセトリ記録

### 曲別ランキング
- 全ライブで演奏された曲を集計
- アーティストフィルタで特定アーティストのみの曲を表示
- 曲の出現頻度を表示

### シェア・保存機能
- セトリ情報を**画像として保存**
- **Web Share API**でSNSに直接シェア
- クリップボードへのコピー（実装済み・UI非表示）

### ユーザー認証
- **Google認証**でログイン
- ユーザー固有のデータ管理
- ログアウト機能

### PWA対応
- モバイルホーム画面にインストール可能
- オフラインモード対応
- スマートフォンアプリのような使用感

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|----------|------|
| [Next.js](https://nextjs.org) | 16.1.6 | フルスタックフレームワーク |
| [React](https://react.dev) | 19.2.3 | UIライブラリ |
| [TypeScript](https://www.typescriptlang.org) | 5.x | 型安全言語 |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | ユーティリティCSSフレームワーク |
| [lucide-react](https://lucide.dev) | 0.574.0 | SVGアイコンセット |

### 状態管理・UI
| 技術 | バージョン | 用途 |
|------|----------|------|
| [react-hot-toast](https://react-hot-toast.com) | 2.6.0 | トースト通知 |
| [html-to-image](https://github.com/bubkoo/html-to-image) | 1.11.13 | HTML→PNG変換 |

### バックエンド・データベース
| 技術 | バージョン | 用途 |
|------|----------|------|
| [Firebase](https://firebase.google.com) | 12.9.0 | BaaS（認証・Firestore） |
| [Google Gemini API](https://ai.google.dev) | 2.5-flash | 画像解析・AI |

### PWA・オフライン
- **Service Worker** (`sw.js`)：オフラインキャッシュ戦略
- **Web Manifest** (`manifest.json`)：PWAメタデータ

---

## インストール

### 必要な環境
- **Node.js** 18.x 以上
- **npm** 9.x 以上（または yarn / pnpm）
- **Git**

### リポジトリのクローン

```bash
git clone https://github.com/yourusername/setlist-app.git
cd setlist-app
```

### 依存パッケージのインストール

```bash
npm install
```

または

```bash
yarn install
pnpm install
bun install
```

---

## セットアップ

### Firebase プロジェクト設定

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. 新しいプロジェクトを作成
3. **Authentication**を有効化
   - Google認証プロバイダを有効化
4. **Firestore Database**を作成
   - ロケーション選択（推奨：asia-northeast1）
   - セキュリティルールを設定（下記参照）
5. **Storage**を構成（オプション）

### セキュリティルール設定

**Firestore** のセキュリティルール：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーのイベント（events コレクション）
    match /events/{document=**} {
      // ログイン済みユーザーのみアクセス可能
      allow read, write: if request.auth != null;
    }
  }
}
```

### Google Gemini API キー取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. **新しいAPI キーを作成** をクリック
3. キーをコピー

### 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

**注意:** `NEXT_PUBLIC_` プレフィックスはブラウザに公開される変数です（認証不要なAPIのみ）。秘密鍵は含めないでください。

---

## 開発環境

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### ファイル変更での自動リロード

`app/page.tsx` など任意のファイルを編集すると、自動的にホットリロードされます。

### 開発時のデバッグ

**ブラウザの開発者ツール:**
```
F12 キーで開発者ツールを起動
```

**Console タブ:**
- エラーメッセージ確認
- firebase/console.error の確認

**Application タブ:**
- Service Worker の登録確認
- キャッシュストレージ確認
- IndexedDB の確認

### ESLint・型チェック

```bash
# 型チェック
npx tsc --noEmit

# ESLintチェック（設定によって異なる）
npm run lint
```

---

## ビルド・デプロイ

### 本番ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm start
```

### Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com) にサインアップ
2. **New Project** → GitHub リポジトリを連携
3. 環境変数を設定
4. **Deploy** をクリック

**環境変数設定手順:**
```
Project Settings → Environment Variables
上記の `.env.local` の値をすべて入力
```

### 他のホスティング（Firebase Hosting など）

```bash
# ビルド
npm run build

# Next.js の標準ホスティング情報は
# https://nextjs.org/docs/app/building-your-application/deploying 参照
```

---

## ディレクトリ構成

```
setlist-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # ルートレイアウト＆ボトムナビ
│   ├── page.tsx                 # ホーム・ダッシュボード
│   ├── globals.css              # グローバルスタイル
│   ├── history/
│   │   └── page.tsx             # 履歴・管理ページ（CRUD操作）
│   ├── input/
│   │   └── page.tsx             # セトリ入力ページ（AI解析）
│   ├── songs/
│   │   └── page.tsx             # ランキングページ
│   └── next-env.d.ts
├── lib/                          # ユーティリティ・ライブラリ
│   ├── firebase.ts              # Firebase初期化・設定
│   ├── gemini.ts                # Google Gemini API ラッパー
│   └── songUtils.ts             # 曲名正規化関数
├── public/                       # 静的ファイル
│   ├── manifest.json            # PWA マニフェスト
│   ├── sw.js                    # Service Worker
│   ├── icon-192x192.png         # PWA アイコン
│   └── icon-512x512.png         # PWA アイコン（大）
├── .env.local                   # 環境変数（ローカル開発用）
├── tailwind.config.ts           # Tailwind CSS 設定
├── tsconfig.json                # TypeScript 設定
├── next.config.ts               # Next.js 設定
├── package.json                 # 依存パッケージ一覧
└── README.md                    # このファイル
```

### 主要ファイルの説明

#### `app/layout.tsx`
- ルートレイアウトコンポーネント
- ボトムナビゲーションバー（ホーム・入力・ランキング・履歴）
- Toaster（トースト通知）の設定
- Service Worker 登録スクリプト

#### `app/page.tsx`
- ホームページ・ダッシュボード
- ユーザー認証状態の表示
- 参加数・アーティスト数・曲数の統計表示
- アーティストランキング表示

#### `app/history/page.tsx`
- 全セトリの一覧表示
- 検索機能（アーティスト・会場・曲で検索）
- 編集・削除機能
- 画像保存機能

#### `app/input/page.tsx`
- セトリ入力ページ
- 画像アップロード＆AI解析
- 手動で曲追加・編集・削除
- 曲の並び替え機能

#### `app/songs/page.tsx`
- 曲のランキング表示
- アーティストフィルタ

#### `lib/firebase.ts`
- Firebase アプリケーション初期化
- Firestore・Authentication・Storage エクスポート

#### `lib/gemini.ts`
- `extractSetlistFromImage()` 関数
- 画像ファイルをBase64に変換
- Gemini APIへと曲名抽出リクエスト送信
- JSON形式の曲名配列を返す

#### `lib/songUtils.ts`
- `normalizeSongTitle()` 関数
- 曲名の表記揺れを吸収（大文字・全角など）
- 同一曲のカウント精度向上

#### `public/manifest.json`
- PWA メタデータ
- アイコン・名前・説明を定義

#### `public/sw.js`
- Service Worker スクリプト
- キャッシュファースト戦略で静的リソースを管理

---

## API・外部サービス

### Firebase Authentication（認証）

**エンドポイント**: Firebase Console で管理

**使用メソッド:**
- `signInWithPopup()` - Google ポップアップでログイン
- `signOut()` - ログアウト
- `onAuthStateChanged()` - 認証状態の監視

```typescript
// ログイン例
await signInWithPopup(auth, provider);

// ユーザー情報取得
auth.currentUser.uid
auth.currentUser.displayName
auth.currentUser.email
```

### Firebase Firestore（データベース）

**コレクション構成:**

```
events/ {
  id: string              // ドキュメントID
  date: string            // ISO形式の日付 (YYYY-MM-DD)
  title: string           // 公演名
  venue: string           // 会場名
  artist?: string         // アーティスト名
  songs: string[]         // 曲名配列
  createdAt: Timestamp    // 作成日時
  uid: string             // ユーザーID
  imageUrl?: string       // 画像URL（オプション）
}
```

**クエリ例:**

```typescript
// 全イベント取得（降順）
const q = query(
  collection(db, 'events'),
  orderBy('date', 'desc')
);
const querySnapshot = await getDocs(q);

// イベント追加
await addDoc(collection(db, 'events'), {
  date: '2026-03-15',
  title: 'Summer Music Fest 2026',
  venue: 'Tokyo Dome',
  artist: 'The Beatles',
  songs: ['Hey Jude', 'Let It Be'],
  createdAt: new Date(),
  uid: auth.currentUser?.uid,
});

// イベント更新
await updateDoc(doc(db, 'events', eventId), {
  title: '新しいタイトル',
  songs: ['新しい曲1', '新しい曲2'],
});

// イベント削除
await deleteDoc(doc(db, 'events', eventId));
```

### Google Gemini API（画像解析）

**エンドポイント**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**リクエスト例:**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent([
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData,
    },
  },
  'この画像からセットリスト（曲名）を抽出して、JSON配列形式で返してください。',
]);
```

**レスポンス例:**

```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "[\"Hey Jude\", \"Let It Be\", \"Blackbird\"]"}]
    }
  }]
}
```

---

## 使い方

### 基本的な流れ

#### 1. ログイン
- アプリを開く → 「Googleでログインして始める」をクリック
- Googleアカウントでサイン イン

#### 2. セトリを記録
- ボトムナビの「入力」をクリック
- セットリスト写真をアップロード
- 「魔法で読み込む」をクリック
- AIが曲名を自動抽出
- 日付・公演名・会場・アーティスト名を入力
- 「保存」をクリック

#### 3. セトリを検索・管理
- ボトムナビの「履歴」をクリック
- 検索ボックスでアーティスト・曲を検索
- 「セトリを見る」で詳細表示
- 「編集」で情報を修正
- 「削除」で記録を削除

#### 4. ランキングを確認
- ボトムナビの「ランキング」をクリック
- アーティストフィルタで絞り込み
- よく演奏される曲をチェック

#### 5. ホーム画面で統計を確認
- ホームボタンで戻る
- 参加数・アーティスト数・曲数を確認
- 直近のセトリ記録を確認

### スマートフォンにインストール

#### iOS（Safari）
1. Safari でアプリを開く
2. 共有ボタン → ホーム画面に追加
3. アプリ名を確認 → 追加

#### Android（Chrome）
1. Chrome でアプリを開く
2. メニュー（⋮）→ アプリをインストール
3. インストール確認

---

## トラブルシューティング

### よくある問題と対処法

#### 「ログインに失敗しました」
**原因**: Firebase 設定エラー

**対処方法:**
```bash
# 1. .env.local の環境変数を確認
# 2. Firebase Console で API キーの有効性を確認
# 3. Google 認証プロバイダが有効か確認
# 4. キャッシュをクリア + リロード（Ctrl+Shift+R）
```

#### 「セトリの読み取りに失敗しました」
**原因**: 画像品質か Gemini API の問題

**対処方法:**
```
1. 異なる画像を試す（明るく、テキストが明確な画像）
2. Gemini API の配額確認（Google AI Studio）
3. ブラウザコンソールでエラーメッセージ確認
4. 画像サイズを確認（最適：1000px 以上）
```

#### 「データの読み込みに失敗しました」
**原因**: Firestore 接続エラー

**対処方法:**
```bash
# 1. インターネット接続確認
# 2. Firebase Console パネルでステータス確認
# 3. セキュリティルール確認（読み取り権限）
# 4. ブラウザキャッシュクリア
# 5. Service Worker を無効化してリセット
```

####  オフラインモードで何も表示されない
**原因**: Service Worker がキャッシュしていない

**対処方法:**
```
1. 一度オンラインでアプリを読み込む
2. Development Tools → Application → Service Workers で確認
3. Cache Storage からキャッシュを確認
4. デメロイ → キャッシュクリア → 再起動
```

####  画像が白く映る（キャプチャ機能）
**原因**: html-to-image の CSS 問題

**対処方法:**
```
1. セトリを「見る」で展開してから試す
2. ボタンは画像に含まれないため問題なし
3. 別ブラウザで試す（Safari / Chrome）
```

#### PWA がインストールできない
**原因**: manifest.json の問題

**対処方法:**
```bash
# 1. manifest.json の有効性確認（JSON Validator）
# 2. public/manifest.json のパス確認
# 3. HTTPS でアクセス（localhost は除く）
# 4. アイコンサイズ確認（192x192 / 512x512）
```

### ログで問題を診断

**ブラウザコンソール（F12）:**
```javascript
// Firebase エラー確認
console.error イベント一覧取得エラー

// Service Worker 確認
navigator.serviceWorker.getRegistrations()

// キャッシュ確認
caches.keys().then(names => console.log(names))
```

---

## よくある質問

### Q1. 他のユーザーのセトリを見ることはできる？
**A.** いいえ。各ユーザーのセトリは自分のアカウントにのみ表示されます。Firestore のセキュリティルールで保護されています。

### Q2. オフラインで使用できる？
**A.** はい。PWA + Service Worker により、一度アクセスしたページはオフラインで表示されます。ただし、Firestore へのアクセス（新規保存・編集）はオンラインが必要です。

### Q3. 画像ファイルのサイズに制限はある？
**A.** 推奨は 1MB 以下です。大きすぎるとネットワーク遅延やブラウザ処理の負荷が増えます。

### Q4. 削除したセトリは復元できる？
**A.** いいえ。削除は即座に Firestore に反映され、復元不可です。慎重に操作してください。

### Q5. Gemini API は無料？
**A.** 無料枠があります。詳細は [Google AI Pricing](https://ai.google.dev/pricing) を参照。有料プランへの切り替えも可能です。

### Q6. 他のユーザーとセトリを共有できる？
**A.** 現在、直接共有機能はありません。Web Share API でSNS等に画像をシェアできます（予定）。

### Q7. データをエクスポートできる？
**A.** 現在対応していません。今後の機能追加を検討中です。

### Q8. モバイルアプリ版はある？
**A.** PWAとして、ネイティブアプリのようにインストール可能です。あなたのスマートフォンホーム画面から起動できます。

### Q9. 複数デバイスでデータ同期される？
**A.** はい。Firebase を使用しているため、同じ Google アカウントなら全デバイスで自動同期されます。

### Q10. 古いブラウザに対応しているか？
**A.** モダンブラウザ推奨（Chrome, Safari, Firefox, Edge 最新版）。IE は非対応です。

---

## ライセンス

このプロジェクトは **MIT ライセンス**の下で公開されています。

```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## 貢献ガイドライン

バグ報告・機能提案・プルリクエストを歓迎します！

### バグ報告
1. GitHub Issues を開く
2. 詳細な説明と再現手順を記入
3. スクリーンショット・エラーメッセージを添付

### 機能提案
1. Discussion または Issue を開く
2. 実装内容と利点を説明
3. デザイン案があれば添付

### プルリクエスト
1. フォークしてブランチを作成
2. 変更を実装＆テスト
3. コミットメッセージは日本語で明確に
4. PR を作成（説明文に詳細を記入）

---

## サポート

質問や問題がある場合：

- 🐛 **Bug Report**: [GitHub Issues](https://github.com/yourusername/setlist-app/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/setlist-app/discussions)

---

## 開発者向け情報

### 使用した主要ライブラリのドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Google Generative AI SDK](https://ai.google.dev/docs)
- [html-to-image GitHub](https://github.com/bubkoo/html-to-image)

### コード規約

- **ファイル名**: kebab-case（`my-component.tsx`）
- **コンポーネント名**: PascalCase（`MyComponent`）
- **変数・関数**: camelCase（`myVariable`, `myFunction`）
- **定数**: SCREAMING_SNAKE_CASE（`API_KEY`）
- **コメント**: 日本語で明確に記述

### フォルダ構成の追加

新しいページを追加する場合：

```
app/
├── new-feature/
│   ├── page.tsx          # ページコンポーネント
│   └── components/       # 専用コンポーネント（オプション）
│       └── Feature.tsx
```

---

**このプロジェクトで何か質問があれば、遠慮なく Issue や Discussion を作成してください！**

Happy coding! 
