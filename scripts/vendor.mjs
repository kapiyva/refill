// Refreshes the vendor blocks at the end of refill.html from node_modules.
// This is the only step that needs Node; refill.html itself is never built.
//
//   npm install && npm run vendor
import { readFileSync, writeFileSync } from "node:fs";

// Read files straight from node_modules: package "exports" maps hide them.
const mod = (path) => new URL(`../node_modules/${path}`, import.meta.url);
const read = (path) => readFileSync(mod(path), "utf8");
const version = (pkg) => JSON.parse(read(`${pkg}/package.json`)).version;

// Keep embedded code from closing its own <script> element early.
const safe = (js) => js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");

const blocks = [
  `<!-- htm ${version("htm")} (bundles Preact) — https://github.com/developit/htm — Apache-2.0 -->`,
  `<script>${safe(read("htm/preact/standalone.umd.js"))}</script>`,
  `<!-- sql.js ${version("sql.js")} — https://github.com/sql-js/sql.js — MIT -->`,
  `<script>${safe(read("sql.js/dist/sql-wasm.js"))}</script>`,
  `<script type="application/octet-stream" id="sqljs-wasm">${readFileSync(mod("sql.js/dist/sql-wasm.wasm")).toString("base64")}</script>`,
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
