# refill

ブラウザで動く [note.db](https://github.com/kapiyva/notedb) 用クライアント。

[English](README.md) | 日本語

## 概要

refill は note.db 規約に準拠した SQLite ファイルをブラウザ内で読み書きする汎用クライアントです。

- **完全クライアントサイド** — WASM-SQLite で全処理がブラウザ内、サーバー送信なし
- **静的配信** — GitHub Pages / Cloudflare Pages 等で配信可能
- **フォーマット非依存** — 任意の note.db 準拠ファイルで動く
- **リファレンス実装** — 最小依存・プレーンな実装で note.db の動作を示す

## 機能

- ローカル SQLite ファイルの読み込み (ファイル選択 / ドラッグ&ドロップ)
- GitHub URL からのフォーマット取り込み (`format.sql`)
- ノートテーブル・関連テーブル・ビューの自動検出
- ノートレコードの CRUD (Markdown エディタ + プロパティパネル、NULL 表現対応)
- 関連テーブル (規約 5: `note_id` + `label`) のサブフォーム編集
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

- [note.db](https://github.com/kapiyva/notedb) — refill が依拠する規約
