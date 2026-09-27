import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(".next", { force: true, recursive: true });

// Next 15 can race while writing app route manifests on Windows. Keeping the
// build in worker mode avoids intermittent PageNotFoundError failures.
process.env.NEXT_PRIVATE_BUILD_WORKER ??= "1";

const nextBin = join("node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
