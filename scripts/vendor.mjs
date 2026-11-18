// Refreshes the vendor blocks at the end of refill.html from node_modules.
// This is the only step that needs Node; refill.html itself is never built.
//
//   npm install && npm run vendor
import { readFileSync, writeFileSync } from "node:fs";

// Read files straight from node_modules: package "exports" maps hide them.
const mod = (path) => new URL(`../node_modules/${path}`, import.meta.url);
const read = (path) => readFileSync(mod(path), "utf8");
const version = (pkg) => JSON.parse(read(`${pkg}/package.json`)).version;

// Every block is embedded byte for byte, so it must not contain anything the
// HTML parser would act on inside a <script>. Fail rather than rewrite code.
const verbatim = (js, name) => {
  if (/<\/script|<!--/i.test(js)) throw new Error(`${name} contains </script or <!--; cannot embed verbatim`);
  return js;
};

const SQLITE = "@sqlite.org/sqlite-wasm";
const blocks = [
  `<!-- htm ${version("htm")} (bundles Preact) — https://github.com/developit/htm — Apache-2.0 -->`,
  `<script>${verbatim(read("htm/preact/standalone.umd.js"), "htm standalone.umd.js")}</script>`,
  `<!-- ${SQLITE} ${version(SQLITE)} — official SQLite WebAssembly build — https://sqlite.org/wasm — Apache-2.0 (wrapper), public domain (SQLite) -->`,
  `<script type="text/plain" id="sqlite3-module">${verbatim(read(`${SQLITE}/dist/index.mjs`), "index.mjs")}</script>`,
  `<script type="application/octet-stream" id="sqlite3-wasm">${readFileSync(mod(`${SQLITE}/dist/sqlite3.wasm`)).toString("base64")}</script>`,
];

const BEGIN = "<!-- vendor:begin";
const END = "<!-- vendor:end -->";
const file = new URL("../refill.html", import.meta.url);
const src = readFileSync(file, "utf8");
const start = src.indexOf(BEGIN);
const end = src.indexOf(END);
if (start === -1 || end === -1 || end < start) throw new Error("vendor markers not found in refill.html");
const headerEnd = src.indexOf("\n", start) + 1;
const out = src.slice(0, headerEnd) + blocks.join("\n") + "\n" + src.slice(end);
writeFileSync(file, out);
console.log(`refill.html: ${(out.length / 1024).toFixed(0)} KiB`);
