import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const port = Number(process.env.PORT || 5173);

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".pdf", "application/pdf"],
]);

function safeResolve(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split("?")[0]).replace(/\\/g, "/");
  const rel = cleaned === "/" ? "/index.html" : cleaned;
  const abs = path.resolve(root, "." + rel);
  if (!abs.startsWith(root)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  try {
    const filePath = safeResolve(req.url || "/");
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": mime.get(ext) || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dev server: http://localhost:${port}`);
  console.log(`Root: ${root}`);
});

