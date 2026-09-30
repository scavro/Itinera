// Isolated browser QA: ephemeral D1, disposable login, fake secrets, intercepted APIs.
// This never alters local Wrangler storage or production. Stop with Ctrl+C to retire it.
import { createServer } from "node:http";
import { readFile, writeFile, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from "miniflare";
import { hashPassword } from "../server/auth.ts";
import { initialTrip } from "../src/domain.ts";
import { mockExternal, fixtureMode } from "./research-fixture.mjs";
const origin = "http://127.0.0.1:8790";
const credentialsFile = "/tmp/itinera-research-qa.json";
const password = randomBytes(24).toString("base64url");
fixtureMode.delay = 700;
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    scriptPath: ".worker-build/index.js",
    compatibilityDate: "2026-09-29",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    outboundService: mockExternal,
    durableObjects: { AUTH_GATE: { className: "AuthGate", useSQLite: true } },
    bindings: {
      APP_ORIGIN: origin,
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      GEMINI_API_KEY: "mock-only",
      TAVILY_API_KEY: "mock-only",
      GEMINI_MODEL: "gemini-3.5-flash-lite",
      OPENAI_MODEL: "gpt-5-mini",
      ALLOW_PAID_AI: "false",
      SEARCH_MONTHLY_LIMIT: "200",
      AI_MONTHLY_LIMIT: "50",
    },
    assets: {
      directory: "dist",
      binding: "ASSETS",
      run_worker_first: true,
      routerConfig: {
        has_user_worker: true,
        invoke_user_worker_ahead_of_assets: true,
      },
      assetConfig: { not_found_handling: "single-page-application" },
    },
    log: new Log(LogLevel.ERROR),
  }),
);
const db = await mf.getD1Database("DB");
const sql =
  (await readFile("migrations/0001_private_notebook.sql", "utf8")) +
  (await readFile("migrations/0002_research.sql", "utf8"));
for (const statement of sql
  .replace(/--[^\n]*/g, "")
  .match(
    /CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|(?:UNIQUE )?INDEX)[\s\S]*?;/g,
  ))
  await db.prepare(statement).run();
const now = new Date().toISOString();
await db
  .prepare(
    'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt,username,displayUsername) VALUES (?,?,?,?,?,?,?,?)',
  )
  .bind(
    "owner",
    "QA aislada",
    "qa@itinera.invalid",
    1,
    now,
    now,
    "prueba",
    "prueba",
  )
  .run();
await db
  .prepare(
    "INSERT INTO account(id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)",
  )
  .bind(
    "qa",
    "owner",
    "credential",
    "owner",
    await hashPassword(password),
    now,
    now,
  )
  .run();
await db
  .prepare(
    "INSERT INTO notebook(id,payload,version,mutation_id,updated_at) VALUES ('owner',?,0,'',?)",
  )
  .bind(
    JSON.stringify({
      trips: [initialTrip],
      active: initialTrip.id,
      provider: "Gemini",
    }),
    now,
  )
  .run();
await writeFile(
  credentialsFile,
  JSON.stringify({ username: "prueba", password }),
  { mode: 0o600 },
);
const server = createServer(async (req, res) => {
  try {
    // Test controls exist only in this Node bridge, never in the deployed application.
    if (
      req.method === "POST" &&
      ["/qa/fail", "/qa/recover"].includes(req.url)
    ) {
      fixtureMode.failure = req.url === "/qa/fail";
      res.writeHead(204);
      res.end();
      return;
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 524288) throw new Error("too-large");
      chunks.push(chunk);
    }
    const response = await mf.dispatchFetch(origin + req.url, {
      method: req.method,
      headers: req.headers,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
      redirect: "manual",
    });
    for (const [key, value] of response.headers)
      if (key !== "set-cookie" && key !== "content-length")
        res.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader("set-cookie", cookies);
    res.statusCode = response.status;
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end("Fallo del entorno de QA aislado");
  }
});
await new Promise((resolve) => server.listen(8790, "127.0.0.1", resolve));
console.log(
  "QA aislada en http://127.0.0.1:8790 · proveedores simulados; sin tráfico real",
);
let retiring = false;
async function retire() {
  if (retiring) return;
  retiring = true;
  server.close();
  await mf.dispose();
  await rm(credentialsFile, { force: true });
  process.exit(0);
}
process.on("SIGINT", retire);
process.on("SIGTERM", retire);
