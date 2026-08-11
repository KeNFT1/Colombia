import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const distDir = join(process.cwd(), "dist");
const assets = {};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "server") walk(path);
      continue;
    }

    const route = `/${relative(distDir, path).replaceAll("\\", "/")}`;
    assets[route] = {
      body: readFileSync(path, "utf8"),
      contentType: contentTypes[extname(path)] || "application/octet-stream",
    };
  }
}

walk(distDir);
assets["/"] = assets["/index.html"];

mkdirSync(join(distDir, "server"), { recursive: true });
mkdirSync(join(distDir, ".openai"), { recursive: true });

writeFileSync(join(distDir, ".openai", "hosting.json"), readFileSync(join(process.cwd(), ".openai", "hosting.json"), "utf8"));

writeFileSync(
  join(distDir, "server", "index.js"),
  `const assets = ${JSON.stringify(assets)};\n\nexport default {\n  async fetch(request) {\n    const url = new URL(request.url);\n    const normalized = url.pathname.endsWith("/") && url.pathname !== "/" ? url.pathname.slice(0, -1) : url.pathname;\n    const asset = assets[normalized] || assets[url.pathname] || assets["/index.html"];\n\n    return new Response(asset.body, {\n      headers: {\n        "content-type": asset.contentType,\n        "cache-control": normalized.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache"\n      }\n    });\n  }\n};\n`
);
