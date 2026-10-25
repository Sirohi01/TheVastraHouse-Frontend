import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * Clears previous build output but keeps .next/cache: container builders (Coolify's Railpack)
 * mount it as a persistent cache volume, and removing a mount point fails with EBUSY. The cache
 * only holds reusable compiler/fetch data, so keeping it is safe and makes builds faster.
 */
function cleanBuildOutput() {
  if (!existsSync(".next")) return;
  for (const entry of readdirSync(".next")) {
    if (entry !== "cache") rmSync(join(".next", entry), { force: true, recursive: true });
  }
}

cleanBuildOutput();

// Next 15 can race while writing app route manifests on Windows. Keeping the
// build in worker mode avoids intermittent PageNotFoundError failures.
process.env.NEXT_PRIVATE_BUILD_WORKER ??= "1";

const nextBin = join("node_modules", "next", "dist", "bin", "next");
let result = spawnSync(process.execPath, [nextBin, "build"], {
  env: process.env,
  stdio: "inherit",
});

if (result.status !== 0) {
  cleanBuildOutput();
  result = spawnSync(process.execPath, [nextBin, "build"], {
    env: process.env,
    stdio: "inherit",
  });
}

process.exit(result.status ?? 1);
