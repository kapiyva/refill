# refill

ブラウザで動く [note.sql](https://github.com/kapiyva/note.sql) 用クライアント。

[English](README.md) | 日本語

## 概要

refill は note.sql 規約に準拠した SQLite ファイルをブラウザ内で読み書きする汎用クライアントです。

- **完全クライアントサイド** — WASM-SQLite で全処理がブラウザ内、サーバー送信なし
- **静的配信** — GitHub Pages / Cloudflare Pages 等で配信可能
- **フォーマット非依存** — 任意の note.sql 準拠ファイルで動く
- **リファレンス実装** — 最小依存・プレーンな実装で note.sql の動作を示す

## 機能

- ローカル SQLite ファイルの読み込み (ファイル選択 / ドラッグ&ドロップ)
- GitHub URL からのフォーマット取り込み (`format.sql`)
- ノートテーブル (規約 1)・プロパティテーブルとその参照 (規約 4)・ビューの自動検出
- ノートレコードの CRUD (Markdown エディタ + プロパティパネル、NULL 表現対応)。`title` は任意で、無題のノートは本文の先頭行で一覧表示
- 規約 4 のプロパティ編集: 単一値の参照はラベル選択、多値の参照 (中間テーブル) はラベルのトグル、語彙へのラベル追加
- ビューの読み取り専用表示
- 編集後の DB ファイルへの書き戻し (ダウンロード)

## 開発

```bash
pnpm install
pnpm dev
```

http://localhost:5173/ を開く。SQLite ファイルをドロップするか、GitHub の `format.sql` URL を入力。

検証用の最小フィクスチャ:

```bash
sqlite3 fixtures/test.db < fixtures/seed.sql
```

## 技術スタック

- React 18 + Vite 6 + TypeScript
- Tailwind CSS v4
- [`@sqlite.org/sqlite-wasm`](https://github.com/sqlite/sqlite-wasm) — 公式 WASM SQLite
- [`marked`](https://github.com/markedjs/marked) + [`dompurify`](https://github.com/cure53/DOMPurify) — Markdown レンダリング (サニタイズ込み)

## ライセンス

[MIT](LICENSE)

## 関連

- [note.sql](https://github.com/kapiyva/note.sql) — refill が依拠する規約
