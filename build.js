// eslint-disable-next-line @typescript-eslint/no-var-requires
require("esbuild").buildSync({
  entryPoints: ["main.ts"], // エントリーファイル
  bundle: true, // バンドル（単一ファイル化）
  platform: "node", // Node.js 用にビルド
  target: "node12", // Node.js のバージョン指定
  outfile: "dist/main.js", // 出力ファイル
  format: "cjs", // CommonJS 形式
});

console.log("Build complete!");
