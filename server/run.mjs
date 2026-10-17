import { mkdirSync, chownSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// Railway volumes may be mounted with root ownership. Initialize only the
// application data directory, then drop privileges before loading the server.
if (process.getuid?.() === 0) {
  const file = process.env.DATABASE_PATH || "/var/data/commerce.sqlite";
  mkdirSync(dirname(file), { recursive: true });
  for (const path of [dirname(file), file, `${file}-wal`, `${file}-shm`])
    if (existsSync(path)) chownSync(path, 1000, 1000);
  process.setgid(1000);
  process.setuid(1000);
}
await import("./index.mjs");
