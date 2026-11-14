# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

Screeps (screeps.com) 用の AI を TypeScript で書いたもの。ソースは `src/` 以下に置き、esbuild で 1 つの `dist/main.js` にまとめ、それをゲームが実行する。ゲームが読むのは `dist/main.js` だけなので、ソースのフォルダ構成は自由に決めてよい。コード中のコメントやログはほぼ日本語。

```
src/
  main.ts          tick ごとのループ
  constants.ts
  flags/           旗の色ごとの処理（index.ts が振り分け表）
  roles/           creep の役割ごとの処理（index.ts が振り分け表）
  structures/      構造物ごとの処理（index.ts が振り分け表）
  room/            部屋単位の処理（index.ts = roomBehavior、labManager.ts）
  utils/           共通処理（index.ts、creep.ts、common.ts、array.ts）
  types/           グローバルな型宣言（screeps.d.ts、global.d.ts、lodash.d.ts）
docs/              基地レイアウトと合成手順の図
```

## コマンド

開発は WSL 上のローカル Node で行う。Node のバージョンは `.nvmrc`（24）に合わせる（`nvm use`）。Screeps の実行環境も 2026-04 から Node 24 なので、`build.js` の esbuild target は `node24` にしている。一方、ゲーム内の lodash は 3.10.1 のままなので、`@types/lodash` は 3.10.1 に固定している。

- `yarn es` — 型チェック、format と lint 修正のあと、esbuild（`build.js`）で `src/main.ts` を `dist/main.js` にまとめる。実際に使うビルドはこれ。
- `npx tsc --noEmit` — 型チェックだけ行う。
- `yarn lint` / `yarn format` — ESLint / Prettier（format は `eslint --fix` も実行する）。
- `yarn deps` — dependency-cruiser で `src/` の依存グラフ `main.dot` を作り直す。循環依存と未使用モジュールは警告になる（`npx depcruise src` で警告だけ確認できる）。
- `yarn sync` — `dist/` をローカルの Screeps クライアントのスクリプトフォルダに rsync する（WSL から Windows のパスへ）。

テストはない。動作はゲーム内で確かめる。

husky の pre-commit フックは `yarn es` と `yarn deps` を実行し、`dist/` と `main.dot` を強制的に add してから lint-staged を実行する。この 2 つは `.gitignore` に入っているが、意図的にコミットしている。そのため、どのコミットにも `dist/main.js` と `main.dot` の差分が含まれる。

## アーキテクチャ

### tick ごとの処理（`src/main.ts`）

`module.exports.loop` は 1 tick に 1 回、次の順で実行される。

1. CPU bucket の判定: bucket が 100 を下回ると `Memory.do` を false にし、200 を超えると true に戻す。false の間はその tick の処理を飛ばす。bucket が 10000 になったら pixel を生成する。生成直後は bucket が減るが、`Memory.pixelGenerated` が立っている間は止めずに動かし続ける。
2. 旗: 色ごとに `flags/index.ts` で処理を振り分ける（赤 = 部屋の占領、白 = 旗の位置にある建物の撤去、紫 = 部屋の放棄）。
3. 自分が持つ部屋（ハイウェイを除く）ごとに次を実行する。
   - `room/index.ts` の `roomBehavior(room)`: セーフモード、ほとんどの役割の creep の生成、建設予定地の自動配置、道路マップ。
   - 構造物の処理: `structureType` ごとに `structures/index.ts` で振り分ける。
   - creep の処理: `creep.memory.role` ごとに `roles/index.ts` で振り分ける。creep は今いる部屋ではなく `memory.baseRoom` でまとめる。
4. 死んだ creep と、なくなった部屋・factory・terminal の Memory を削除する。

全体を `logUsage(title, fn)`（`utils/index.ts`）で包んでいて、処理ごとの CPU 使用量を入れ子でログに出す。

### 振り分け表

新しい処理を足すときは、モジュールを作り、対応する表に登録する。

- `roles/index.ts` — `Record<ROLES, CreepBehavior>`。役割ごとに `roles/<name>.ts` を 1 つ作る。
- `structures/index.ts` — `structures/<type>.ts`（factory は今はコメントアウト中）。
- `flags/index.ts` — `flags/<color>.ts`。

### creep を生成する場所

creep の生成は 1 か所にまとまっていない。その役割を必要とするモジュールがそれぞれ生成する。

- `room/index.ts` — harvester、carrier、defender、builder、gatherer
- `structures/controller.ts` — upgrader
- `structures/extractor.ts` — mineralHarvester
- `room/labManager.ts` — labManager
- `flags/red.ts` — claimer

creep 名は `<接頭辞>_<部屋名>_<Game.time>` の形にする。最初の `_` より前の接頭辞が、毎 tick creep の上に表示される。体の構成は `utils/creep.ts` の `filterBodiesByCost(role, energy)` / `getCarrierBody` で決める。

### 型と Memory

- 型はすべて `types/screeps.d.ts` にグローバル宣言でまとめている（`ROLES`、役割ごとの `XxxMemory` と `Xxx extends Creep`、`RoomMemory`、`Memory` に足したフィールド `terminals` / `factories` / `do` など）。役割や Memory のフィールドを増やすときは、ここにも宣言を足す。
- `types/global.d.ts` で lodash をグローバルの `_` として使えるようにしている。Screeps の実行環境に合わせて lodash **3.x**（`@types/lodash@3.10.1`）を使っている。チェーンは `_(...).filter().first()` / `.run()` / `.value()` の形で書き、lodash 4 にしかない API は使わない。
- `utils/common.ts` に、型付きの `ObjectKeys` / `ObjectEntries` がある。

### tick 単位のキャッシュ

いくつかの関数は、計算結果を `Game.time` と一緒に `room.memory` に保存し、同じ tick 内では 1 回しか計算しない。

- `findMyStructures(room)`（`utils/index.ts`）— 部屋の構造物を種類別に分けたものと source。
- `getCreepsInRoom(room)`（`utils/creep.ts`）— その `baseRoom` に属する creep を役割別に分けたもの。数値の `timestamp` キーも入っているので、値をループするときは除外する。

`room.memory.find` は毎 tick の最後に削除する。

### 資源、lab、terminal

- `TRANSFER_THRESHOLD`（constants.ts、1000）は、terminal や factory に各資源をどれだけ置くかの基準値。labManager の creep、carrier、factory、terminal が共通で使う。
- `room/labManager.ts` は lab で何を合成するかと、どの役割の creep をブーストするか（mineralHarvester → builder → upgrader の順）を決める。`roles/labManager.ts` の creep が、storage・terminal・factory・lab の間で鉱物を運ぶ。`docs/*.dot` は合成の手順を表した図。
- `structures/terminal.ts` は、まず自分の terminal 同士で資源を融通する。そのあと、terminal ごとの仮想予算（`Memory.terminals[id].cache`）でマーケット取引をする。余った資源を売って予算を作り、足りない基本鉱物を買う。取引したら `reserved` に記録し、terminal のクールダウンが終わってから `Game.market` の取引履歴と照らし合わせて予算に反映する。

### 基地レイアウト

目標とする基地レイアウトは `docs/BasePlanning.md` / `docs/BasePlaning.png` にある。建設予定地を置く処理は `room/index.ts` の `createStructures`。
