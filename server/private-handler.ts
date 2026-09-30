import { createAuth } from "./auth";
import { saveSchema } from "./schema";
import { initialTrip } from "../src/domain";

const publicAssets =
  /^\/(assets\/(?:index-[\w-]+\.(?:js|css)|[\w-]+\.woff2?)|favicon\.svg|theme\.js)$/;
const authRoutes = new Set([
  "/api/auth/sign-in/username",
  "/api/auth/sign-out",
]);
function secure(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, private");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
const json = (value: unknown, status = 200) =>
  secure(Response.json(value, { status }));
async function boundedJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("content-type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512000) {
      await reader.cancel();
      throw new Error("size");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}
type Stored = { payload: string; version: number; mutation_id: string | null };
export async function handlePrivate(
  request: Request,
  env: Env,
  auth = createAuth(env),
): Promise<Response> {
  const url = new URL(request.url);
  try {
    if (
      !env.APP_ORIGIN ||
      !env.BETTER_AUTH_SECRET ||
      env.BETTER_AUTH_SECRET.length < 32
    ) {
      return json({ error: "El acceso todavía no está configurado." }, 503);
    }
    // Never accept an alternative hostname for credentials or private pages.
    if (url.origin !== env.APP_ORIGIN)
      return json({ error: "Dirección no autorizada." }, 403);
    if (
      !["GET", "HEAD"].includes(request.method) &&
      request.headers.get("origin") !== env.APP_ORIGIN
    ) {
      return json({ error: "Petición no autorizada." }, 403);
    }
    if (url.pathname.startsWith("/api/auth/")) {
      if (!authRoutes.has(url.pathname) || request.method !== "POST")
        return json({ error: "Ruta no disponible." }, 404);
      let body;
      try {
        body = await boundedJson(request);
      } catch {
        return json({ error: "Petición no válida." }, 400);
      }
      if (url.pathname.endsWith("/username")) {
        if (
          !body ||
          typeof body !== "object" ||
          typeof body.username !== "string" ||
          typeof body.password !== "string" ||
          body.username.length > 100 ||
          body.password.length > 128
        ) {
          return json({ error: "Usuario o contraseña incorrectos." }, 400);
        }
        body = {
          username: body.username,
          password: body.password,
          rememberMe: false,
        };
      } else body = {};
      const headers = new Headers(request.headers);
      // Cloudflare supplies this header; local development gets a fixed rate-limit bucket.
      if (!headers.has("cf-connecting-ip"))
        headers.set("cf-connecting-ip", "127.0.0.1");
      const response = await auth.handler(
        new Request(request.url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }),
      );
      return secure(
        new Response(
          JSON.stringify(
            response.ok
              ? { ok: true }
              : {
                  error:
                    response.status === 429
                      ? "Demasiados intentos."
                      : "Usuario o contraseña incorrectos.",
                },
          ),
          { status: response.status, headers: response.headers },
        ),
      );
    }
    const session = await auth.api.getSession({ headers: request.headers });
    const authenticated = session?.user.id === "owner";
    if (url.pathname === "/api/session" && request.method === "GET") {
      return authenticated
        ? json({
            username: session.user.username,
            expiresAt: session.session.expiresAt.toISOString(),
          })
        : json({ error: "Entra para abrir tu cuaderno." }, 401);
    }
    if (url.pathname.startsWith("/api/")) {
      if (!authenticated)
        return json({ error: "La sesión ha finalizado." }, 401);
      if (url.pathname !== "/api/notebook")
        return json({ error: "Ruta no disponible." }, 404);
      const seed = JSON.stringify({
        trips: [initialTrip],
        active: initialTrip.id,
        provider: "OpenAI",
      });
      await env.DB.prepare(
        "INSERT OR IGNORE INTO notebook (id,payload,version) VALUES ('owner',?,0)",
      )
        .bind(seed)
        .run();
      const read = () =>
        env.DB.prepare(
          "SELECT payload,version,mutation_id FROM notebook WHERE id='owner'",
        ).first<Stored>();
      if (request.method === "GET") {
        const row = await read();
        return json({
          data: JSON.parse(row!.payload),
          version: row!.version,
        });
      }
      if (request.method !== "PUT")
        return json({ error: "Método no permitido." }, 405);
      let input;
      try {
        input = saveSchema.safeParse(await boundedJson(request));
      } catch {
        return json({ error: "Datos no válidos." }, 400);
      }
      if (!input.success)
        return json({ error: "Revisa los datos del viaje." }, 400);
      const { data, version, mutationId } = input.data;
      const row = await env.DB.prepare(
        "UPDATE notebook SET payload=?,version=version+1,mutation_id=?,updated_at=unixepoch() WHERE id='owner' AND version=? RETURNING version",
      )
        .bind(JSON.stringify(data), mutationId, version)
        .first<{ version: number }>();
      if (row) return json({ version: row.version });
      const latest = await read();
      if (latest?.mutation_id === mutationId)
        return json({ version: latest.version });
      return json(
        { error: "El cuaderno ha cambiado en otro dispositivo." },
        409,
      );
    }
    const isLogin = url.pathname === "/login";
    if (!authenticated && !isLogin && !publicAssets.test(url.pathname)) {
      if (
        request.headers.get("sec-fetch-dest") === "document" ||
        url.pathname === "/"
      ) {
        return secure(Response.redirect(`${env.APP_ORIGIN}/login`, 302));
      }
      return json({ error: "Acceso privado." }, 401);
    }
    if (isLogin && authenticated)
      return secure(Response.redirect(`${env.APP_ORIGIN}/`, 302));
    return secure(
      await env.ASSETS.fetch(
        isLogin ? new Request(`${env.APP_ORIGIN}/`, request) : request,
      ),
    );
  } catch {
    // Avoid recording cookies, credentials, request bodies or upstream error details.
    console.error(
      JSON.stringify({ event: "request_failed", path: url.pathname }),
    );
    return json(
      {
        error: "No se ha podido completar la petición. Vuelve a intentarlo.",
      },
      503,
    );
  }
}
