import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from "miniflare";
import { hashPassword } from "../server/auth.ts";

const origin = "https://itinera.test";
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    scriptPath: ".worker-build/index.js",
    compatibilityDate: "2026-09-29",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    bindings: {
      APP_ORIGIN: origin,
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
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
let checks = 0;
const expect = (actual, expected) => {
  assert.equal(actual, expected);
  checks++;
};
const request = (path, options = {}) =>
  mf.dispatchFetch(origin + path, {
    ...options,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "cf-connecting-ip": "192.0.2.1",
      ...options.headers,
    },
  });
try {
  const db = await mf.getD1Database("DB");
  // D1 exec expects complete statements; split at statement boundaries including the trigger.
  const sql = await readFile("migrations/0001_private_notebook.sql", "utf8");
  const statements = sql
    .replace(/--[^\n]*/g, "")
    .match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g);
  for (const statement of statements) await db.prepare(statement).run();
  await assert.rejects(
    db
      .prepare(
        'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
      )
      .bind("another", "Otro", "other@itinera.invalid", 1, 0, 0)
      .run(),
    /Single-owner/,
  );
  checks++;
  expect(
    (await mf.dispatchFetch("https://other.test/api/session")).status,
    403,
  );
  const password = randomBytes(24).toString("base64url");
  const hash = await hashPassword(password);
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt,username,displayUsername) VALUES (?,?,?,?,?,?,?,?)',
    )
    .bind(
      "owner",
      "Propietario",
      "owner@itinera.invalid",
      1,
      now,
      now,
      "prueba",
      "prueba",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)",
    )
    .bind("owner-password", "owner", "credential", "owner", hash, now, now)
    .run();
  const first = await request("/api/notebook");
  expect(first.status, 401);
  expect((await request("/assets/food/orecchiette.jpg")).status, 401);
  const page = await request("/");
  expect(page.status, 302);
  expect(page.headers.get("location"), origin + "/login");
  expect((await request("/login")).status, 200);
  expect((await request("/theme.js")).status, 200);
  expect(
    (await request("/api/auth/sign-up/email", { method: "POST", body: "{}" }))
      .status,
    404,
  );
  expect(
    (
      await request("/api/auth/sign-in/username", {
        method: "POST",
        body: JSON.stringify({ username: "prueba", password: "wrong" }),
      })
    ).status,
    401,
  );
  expect(
    (
      await request("/api/auth/sign-in/username", {
        method: "POST",
        headers: { Origin: "https://other.test" },
        body: "{}",
      })
    ).status,
    403,
  );
  const login = await request("/api/auth/sign-in/username", {
    method: "POST",
    body: JSON.stringify({ username: "prueba", password }),
  });
  expect(login.status, 200);
  const cookies = login.headers.getSetCookie();
  const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
  assert(
    cookies.some(
      (c) =>
        c.includes("HttpOnly") &&
        c.includes("Secure") &&
        c.includes("SameSite=Lax"),
    ),
  );
  checks++;
  expect((await login.json()).ok, true);
  const authHeaders = { Cookie: cookie };
  const session = await request("/api/session", { headers: authHeaders });
  expect(session.status, 200);
  expect(
    Object.keys(await session.json())
      .sort()
      .join(","),
    "expiresAt,username",
  );
  const data = await (
    await request("/api/notebook", { headers: authHeaders })
  ).json();
  expect(data.version, 0);
  const next = structuredClone(data.data);
  next.trips[0].notes = "Persistencia verificada";
  next.provider = "Gemini";
  const mutationId = randomUUID();
  const body = JSON.stringify({ data: next, version: 0, mutationId });
  expect(
    (
      await request("/api/notebook", {
        method: "PUT",
        headers: authHeaders,
        body,
      })
    ).status,
    200,
  );
  expect(
    (
      await request("/api/notebook", {
        method: "PUT",
        headers: authHeaders,
        body,
      })
    ).status,
    200,
  );
  const saved = await (
    await request("/api/notebook", { headers: authHeaders })
  ).json();
  expect(saved.version, 1);
  expect(saved.data.provider, "Gemini");
  expect(saved.data.trips[0].notes, "Persistencia verificada");
  expect(
    (
      await request("/api/notebook", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          data: next,
          version: 0,
          mutationId: randomUUID(),
        }),
      })
    ).status,
    409,
  );
  const invalid = structuredClone(next);
  invalid.trips[0].budgetPerPerson = -1;
  expect(
    (
      await request("/api/notebook", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          data: invalid,
          version: 1,
          mutationId: randomUUID(),
        }),
      })
    ).status,
    400,
  );
  expect(
    (
      await request("/api/notebook", {
        method: "PUT",
        headers: { ...authHeaders, Origin: "https://other.test" },
        body,
      })
    ).status,
    403,
  );
  const second = await request("/api/auth/sign-in/username", {
    method: "POST",
    headers: { "cf-connecting-ip": "192.0.2.2" },
    body: JSON.stringify({ username: "prueba", password }),
  });
  expect(second.status, 200);
  const secondCookie = second.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  expect(
    (
      await (
        await request("/api/notebook", { headers: { Cookie: secondCookie } })
      ).json()
    ).version,
    1,
  );
  expect(
    (
      await request("/api/auth/sign-out", {
        method: "POST",
        headers: authHeaders,
        body: "{}",
      })
    ).status,
    200,
  );
  expect(
    (await request("/api/notebook", { headers: authHeaders })).status,
    401,
  );
  await db
    .prepare("UPDATE session SET expiresAt=?")
    .bind(new Date(Date.now() - 1000).toISOString())
    .run();
  expect(
    (await request("/api/session", { headers: { Cookie: secondCookie } }))
      .status,
    401,
  );
  for (let attempt = 0; attempt < 5; attempt++)
    expect(
      (
        await request("/api/auth/sign-in/username", {
          method: "POST",
          headers: { "cf-connecting-ip": "192.0.2.3" },
          body: JSON.stringify({ username: "prueba", password: "wrong" }),
        })
      ).status,
      401,
    );
  expect(
    (
      await request("/api/auth/sign-in/username", {
        method: "POST",
        headers: { "cf-connecting-ip": "192.0.2.3" },
        body: JSON.stringify({ username: "prueba", password }),
      })
    ).status,
    429,
  );
  console.log(
    `${checks} comprobaciones correctas con Workers y D1 locales (Miniflare).`,
  );
} finally {
  await mf.dispose();
}
