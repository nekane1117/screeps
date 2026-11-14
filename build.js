// eslint-disable-next-line @typescript-eslint/no-require-imports
require("esbuild").buildSync({
  entryPoints: ["src/main.ts"], // エントリーファイル
  bundle: true, // バンドル（単一ファイル化）
  platform: "node", // Node.js 用にビルド
  target: "node24", // Node.js のバージョン指定(screeps の実行環境は 2026-04 から Node 24)
  outfile: "dist/main.js", // 出力ファイル
  format: "cjs", // CommonJS 形式
});

console.log("Build complete!");
