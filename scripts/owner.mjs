import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { hashPassword } from "../server/auth.ts";

const remote = process.argv.includes("--remote");
if (!stdin.isTTY)
  throw new Error("Ejecuta este comando en una terminal interactiva.");
const rl = createInterface({ input: stdin, output: stdout });
const username = (
  await rl.question("Nombre de usuario (3–30 letras, cifras o guiones): ")
)
  .trim()
  .toLowerCase();
rl.close();
if (!/^[a-z0-9_-]{3,30}$/.test(username))
  throw new Error("Nombre de usuario no válido.");
async function masked(label) {
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      function read(chunk) {
        for (const c of chunk.toString()) {
          if (c === "\u0003") {
            stdin.off("data", read);
            reject(new Error("Cancelado."));
            return;
          }
          if (c === "\r" || c === "\n") {
            stdin.off("data", read);
            resolve(value);
            return;
          }
          if (c === "\u007f") value = value.slice(0, -1);
          else if (c >= " ") value += c;
        }
      }
      stdin.on("data", read);
    });
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
    stdout.write("\n");
  }
}
const password = await masked(
  "Contraseña (mínimo 12 caracteres; entrada oculta): ",
);
if (password.length < 12 || password.length > 128)
  throw new Error("Usa entre 12 y 128 caracteres.");
if (password !== (await masked("Repite la contraseña: ")))
  throw new Error("Las contraseñas no coinciden.");
const hash = await hashPassword(password);
const now = new Date().toISOString();
// Wrangler accepts an SQL file rather than bind parameters. Quote every literal
// even though the username is restricted and the hash is generated internally.
const literal = (value) => "'" + value.replaceAll("'", "''") + "'";
const sql = `INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt,username,displayUsername)
VALUES ('owner','Propietario','owner@itinera.invalid',1,${literal(now)},${literal(now)},${literal(username)},${literal(username)})
ON CONFLICT(id) DO UPDATE SET username=excluded.username,displayUsername=excluded.displayUsername,updatedAt=excluded.updatedAt;
INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt)
VALUES ('owner-password','owner','credential','owner',${literal(hash)},${literal(now)},${literal(now)})
ON CONFLICT(id) DO UPDATE SET password=excluded.password,updatedAt=excluded.updatedAt;
DELETE FROM session WHERE userId='owner';`;
const temporary = await mkdtemp(join(tmpdir(), "itinera-owner-"));
try {
  const file = join(temporary, "owner.sql");
  await writeFile(file, sql, { mode: 0o600 });
  const args = [
    "wrangler",
    "d1",
    "execute",
    "itinera",
    remote ? "--remote" : "--local",
    "--file",
    file,
  ];
  if (remote) args.push("--env", "production");
  const result = spawnSync("npx", args, {
    encoding: "utf8",
    env: { ...process.env, WRANGLER_LOG_PATH: join(temporary, "wrangler.log") },
  });
  if (result.status !== 0)
    throw new Error(
      "No se pudo configurar el usuario. Comprueba las migraciones, la conexión y el nombre de la base de datos.",
    );
  console.log(
    `Usuario configurado en ${remote ? "Cloudflare" : "D1 local"}. Las sesiones anteriores han finalizado.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
