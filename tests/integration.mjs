import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from "miniflare";
import { hashPassword } from "../server/auth.ts";

const origin = "https://itinera.test";
import {
  externalCalls,
  fixtureMode,
  mockExternal,
} from "./research-fixture.mjs";

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
  const sql =
    (await readFile("migrations/0001_private_notebook.sql", "utf8")) +
    (await readFile("migrations/0002_research.sql", "utf8"));
  const statements = sql
    .replace(/--[^\n]*/g, "")
    .match(
      /CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|(?:UNIQUE )?INDEX)[\s\S]*?;/g,
    );
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
      "prueba_con-guion",
      "prueba_con-guion",
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
        body: JSON.stringify({
          username: "prueba_con-guion",
          password: "wrong",
        }),
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
    body: JSON.stringify({ username: "prueba_con-guion", password }),
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
  // External providers are intercepted: this proves runtime flow, not live provider acceptance.
  expect(
    (
      await request("/api/research/start", {
        method: "POST",
        body: JSON.stringify({
          tripId: "puglia-demo",
          requestId: randomUUID(),
        }),
      })
    ).status,
    401,
  );
  expect((await request("/api/connections")).status, 401);
  expect(externalCalls.length, 0);
  const c = await (
    await request("/api/connections", { headers: authHeaders })
  ).json();
  expect(c.search.configured, true);
  expect(c.providers.find((p) => p.name === "OpenAI").enabled, false);
  const researchRequest = (path, input) =>
    request("/api/research/" + path, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(input),
    });
  const requestId = randomUUID();
  let job = (
    await (
      await researchRequest("start", { tripId: "puglia-demo", requestId })
    ).json()
  ).job;
  expect(job.status, "ready");
  expect(job.provider, "Gemini");
  const duplicate = (
    await (
      await researchRequest("start", { tripId: "puglia-demo", requestId })
    ).json()
  ).job;
  expect(duplicate.id, job.id);
  expect(externalCalls.length, 0);
  for (let stage = 0; stage < 5; stage++)
    job = (await (await researchRequest("step", { id: job.id, stage })).json())
      .job;
  assert.equal(
    job.status,
    "done",
    `${job.error}; stage=${job.stage}; calls=${externalCalls.length}`,
  );
  checks++;
  expect(job.sources.length, 3);
  expect(job.sources[0].read, "page");
  expect(job.result.visits[0].quote, "Colección de historia");
  expect(externalCalls.length, 5);
  expect(
    (await (await researchRequest("step", { id: job.id, stage: 4 })).json()).job
      .status,
    "done",
  );
  expect(externalCalls.length, 5);
  expect(
    (
      await (
        await request("/api/research?tripId=puglia-demo", {
          headers: authHeaders,
        })
      ).json()
    ).job.id,
    job.id,
  );
  const usage = await (
    await request("/api/connections", { headers: authHeaders })
  ).json();
  expect(usage.search.used, 4);
  expect(usage.ai.used, 1);
  let cancelled = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  cancelled = (
    await (await researchRequest("cancel", { id: cancelled.id })).json()
  ).job;
  expect(cancelled.status, "cancelled");
  expect(
    (
      await (
        await researchRequest("step", { id: cancelled.id, stage: 0 })
      ).json()
    ).job.status,
    "cancelled",
  );
  expect(externalCalls.length, 5);
  fixtureMode.invalidQuote = true;
  let rejected = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  for (let stage = 0; stage < 5; stage++)
    rejected = (
      await (await researchRequest("step", { id: rejected.id, stage })).json()
    ).job;
  expect(rejected.status, "error");
  expect(rejected.sources.length, 3);
  expect(rejected.result, null);
  assert.match(rejected.error, /cita/);
  checks++;
  await researchRequest("cancel", { id: rejected.id });
  fixtureMode.invalidQuote = false;
  const stale = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  const changed = structuredClone(next);
  changed.trips[0].notes = "Otra preferencia";
  await db
    .prepare("UPDATE notebook SET payload=? WHERE id='owner'")
    .bind(JSON.stringify(changed))
    .run();
  expect(
    (await researchRequest("step", { id: stale.id, stage: 0 })).status,
    409,
  );
  expect(
    (
      await (
        await request("/api/research?tripId=puglia-demo", {
          headers: authHeaders,
        })
      ).json()
    ).job.status,
    "cancelled",
  );
  expect(externalCalls.length, 10);
  const concurrent = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  const beforeConcurrent = externalCalls.length;
  fixtureMode.delay = 50;
  await Promise.all(
    [0, 1].map(() => researchRequest("step", { id: concurrent.id, stage: 0 })),
  );
  expect(externalCalls.length, beforeConcurrent + 1);
  await researchRequest("cancel", { id: concurrent.id });
  fixtureMode.delay = 0;
  const recoverable = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  fixtureMode.failure = true;
  const failed = (
    await (
      await researchRequest("step", { id: recoverable.id, stage: 0 })
    ).json()
  ).job;
  expect(failed.status, "error");
  expect(failed.stage, 0);
  fixtureMode.failure = false;
  const recovered = (
    await (
      await researchRequest("step", { id: recoverable.id, stage: 0 })
    ).json()
  ).job;
  expect(recovered.status, "ready");
  expect(recovered.stage, 1);
  expect(recovered.provider, "Gemini");
  await researchRequest("cancel", { id: recoverable.id });
  const redirected = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  fixtureMode.redirect = true;
  const beforeRedirect = externalCalls.length;
  const redirectResult = (
    await (
      await researchRequest("step", { id: redirected.id, stage: 0 })
    ).json()
  ).job;
  expect(redirectResult.status, "error");
  expect(externalCalls.length, beforeRedirect + 1);
  await researchRequest("cancel", { id: redirected.id });
  fixtureMode.redirect = false;
  const beforeLimit = externalCalls.length;
  await db
    .prepare(
      "INSERT INTO research_usage(period,service,reserved) VALUES (?,'search',200) ON CONFLICT(period,service) DO UPDATE SET reserved=200",
    )
    .bind(new Date().toISOString().slice(0, 7))
    .run();
  const limited = (
    await (
      await researchRequest("start", {
        tripId: "puglia-demo",
        requestId: randomUUID(),
      })
    ).json()
  ).job;
  const limitedResult = (
    await (await researchRequest("step", { id: limited.id, stage: 0 })).json()
  ).job;
  expect(limitedResult.status, "error");
  assert.match(limitedResult.error, /límite mensual/);
  checks++;
  expect(externalCalls.length, beforeLimit);
  const second = await request("/api/auth/sign-in/username", {
    method: "POST",
    headers: { "cf-connecting-ip": "192.0.2.2" },
    body: JSON.stringify({ username: "prueba_con-guion", password }),
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
          body: JSON.stringify({
            username: "prueba_con-guion",
            password: "wrong",
          }),
        })
      ).status,
      401,
    );
  expect(
    (
      await request("/api/auth/sign-in/username", {
        method: "POST",
        headers: { "cf-connecting-ip": "192.0.2.3" },
        body: JSON.stringify({ username: "prueba_con-guion", password }),
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
