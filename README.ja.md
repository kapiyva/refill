# refill

[note.sql](https://github.com/kapiyva/note.sql) の SQLite ファイルを扱う、素朴で自己完結したエディタ。

[English](README.md) | 日本語

## 概要

refill は note.sql 規約に準拠した SQLite ファイルをブラウザ内で読み書きします。
目的は、note.sql のファイルがいつでもどこでも開けて、読めて、編集できることを保証することです。

- **1ファイル** — [`refill.html`](refill.html) がプログラムのすべてです。ビルドもインストールもサーバーも不要です
- **オフラインで動き、手元のファイルから直接開ける** — sql.js（WebAssembly 版 SQLite）と Preact を埋め込んであります。外部からの読み込みも、外部への送信もしません
- **フォーマット非依存** — スキーマだけを手がかりに、note.sql 準拠の任意のフォーマットで動きます
- **リファレンス実装** — note.sql 規約がどう動くツールになるかを示す、素直なコードです

## 使い方

- **Web で** — 公開版（GitHub Pages）を開いてファイルを選びます。アプリとしてインストールでき（PWA）、Chromium 系ブラウザではインストールしたアプリから OS 上の `.db` / `.sqlite` ファイルを開けます
- **このサイトなしで、オフラインで** — `refill.html` を一度ダウンロードしてノートと一緒に置いておけば、ダブルクリックでどのモダンブラウザでも開けます

保存は、Chromium 系ブラウザでは開いたファイルへ直接書き戻します（File System Access API）。それ以外のブラウザではコピーのダウンロードになります。

## 機能

- SQLite ファイルを開く（ファイル選択 / ドラッグ&ドロップ）
- `format.sql`（手元のファイルまたは GitHub の URL）から新しいファイルを作る、または開いているファイルにフォーマットを追加する
- ノートテーブル（規約 1）・プロパティテーブルとその参照（規約 4）・ビューの自動検出
- ノートの一覧・閲覧・編集・作成・削除。`title` は任意で、無題のノートは本文の先頭行で一覧表示
- 規約 4 のプロパティ編集: 単一値の参照はラベル選択、多値の参照（中間テーブル）はラベルのトグル、語彙へのラベル追加。それ以外のカラムは NULL を含めて生の値として編集
- ビューの読み取り専用表示
- WAL モードのファイルも、ジャーナルモードを変えずに開いて保存

## 開発

`refill.html` を直接編集してページを再読み込みするだけです。ビルドするものはありません。

Node が必要なのは、`refill.html` の末尾に埋め込んだライブラリを更新するときだけです。

```bash
npm install      # package.json でバージョン固定
npm run vendor   # refill.html の vendor ブロックを書き換える
```

検証用のフィクスチャ:

```bash
sqlite3 fixtures/test.db < fixtures/seed.sql
```

`pwa/` には、公開版をインストール可能・オフライン利用可能にするためのファイル（manifest、Service Worker、アイコン）があります。`refill.html` はこれらがなくても動きます。

## 埋め込みライブラリ

- [sql.js](https://github.com/sql-js/sql.js) — WebAssembly 版 SQLite（MIT）
- [htm](https://github.com/developit/htm) と [Preact](https://preactjs.com/) — ビルドなしの UI（Apache-2.0 / MIT）

## ライセンス

[MIT](LICENSE)

## 関連

- [note.sql](https://github.com/kapiyva/note.sql) — refill が依拠する規約
