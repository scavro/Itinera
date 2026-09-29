import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const production = config.env.production;
if (
  production.vars.APP_ORIGIN.includes("REPLACE_ME") ||
  production.d1_databases[0].database_id.startsWith("00000000")
) {
  console.error(
    "Configura la URL y el identificador D1 de producción en wrangler.jsonc antes de desplegar.",
  );
  process.exit(1);
}
const result = spawnSync("npx", ["wrangler", "deploy", "--env", "production"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
