import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  execFileSync(
    process.execPath,
    ["node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"],
    { cwd: root, stdio: "inherit" },
  );
  const tests = readdirSync(new URL("../.test-build/tests/", import.meta.url))
    .filter((file) => file.endsWith(".test.js"))
    .map((file) => `.test-build/tests/${file}`);
  execFileSync(process.execPath, ["--test", ...tests], {
    cwd: root,
    stdio: "inherit",
  });
} catch (error) {
  process.exit(error.status || 1);
}
