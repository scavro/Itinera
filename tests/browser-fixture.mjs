// Local-only disposable account for browser verification; no production bypass.
import { randomBytes } from "node:crypto";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashPassword } from "../server/auth.ts";
const password = randomBytes(24).toString("base64url");
const hash = await hashPassword(password);
const now = new Date().toISOString();
const temporary = await mkdtemp(join(tmpdir(), "itinera-test-"));
try {
  const file = join(temporary, "fixture.sql");
  await writeFile(
    file,
    `DROP TRIGGER IF EXISTS one_owner;
CREATE TRIGGER one_owner BEFORE INSERT ON "user" WHEN NEW.id != 'owner' BEGIN SELECT RAISE(ABORT,'Single-owner application'); END;
INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt,username,displayUsername) VALUES ('owner','Prueba local','owner@itinera.invalid',1,'${now}','${now}','prueba','prueba') ON CONFLICT(id) DO UPDATE SET username='prueba';
INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES ('owner-password','owner','credential','owner','${hash}','${now}','${now}') ON CONFLICT(id) DO UPDATE SET password=excluded.password;
DELETE FROM session;`,
    { mode: 0o600 },
  );
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", "itinera", "--local", "--file", file],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: join(temporary, "wrangler.log"),
      },
    },
  );
  if (result.status !== 0)
    throw new Error("No se ha creado la cuenta de prueba local.");
  await writeFile(
    "/tmp/itinera-ui-credentials.json",
    JSON.stringify({ username: "prueba", password }),
    { mode: 0o600 },
  );
  console.log("Cuenta temporal de prueba preparada únicamente en D1 local.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
