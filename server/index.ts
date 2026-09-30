import { secure, withSecurityHeaders } from "./security";
import { DurableObject } from "cloudflare:workers";
import { createAuth } from "./auth";
import { handlePrivate } from "./private-handler";

// One coordinator for the sole owner. D1 remains the durable source of sessions/data.
// Native HTTP forwarding preserves Better Auth cookies and streaming request bodies.
export class AuthGate extends DurableObject<Env> {
  private readonly auth = createAuth(this.env);
  async fetch(request: Request): Promise<Response> {
    return handlePrivate(request, this.env, this.auth);
  }
}
const publicAssets =
  /^\/(assets\/(?:index-[\w-]+\.(?:js|css)|[\w-]+\.woff2?)|favicon\.svg|theme\.js)$/;
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (
      !env.BETTER_AUTH_SECRET ||
      env.BETTER_AUTH_SECRET.length < 32 ||
      !env.APP_ORIGIN
    )
      return secure(
        Response.json(
          { error: "El acceso todavía no está configurado." },
          { status: 503, headers: { "Cache-Control": "no-store, private" } },
        ),
      );
    if (
      url.origin !== env.APP_ORIGIN ||
      (!["GET", "HEAD"].includes(request.method) &&
        request.headers.get("Origin") !== env.APP_ORIGIN)
    )
      return secure(
        Response.json(
          { error: "Petición no autorizada." },
          { status: 403, headers: { "Cache-Control": "no-store, private" } },
        ),
      );
    if (
      ["GET", "HEAD"].includes(request.method) &&
      publicAssets.test(url.pathname)
    )
      return withSecurityHeaders(await env.ASSETS.fetch(request));
    try {
      return await env.AUTH_GATE.getByName("owner").fetch(request);
    } catch {
      console.error(
        JSON.stringify({
          event: "private_gate_unavailable",
          path: url.pathname,
        }),
      );
      return secure(
        Response.json(
          { error: "El servicio no está disponible. Vuelve a intentarlo." },
          { status: 503, headers: { "Cache-Control": "no-store, private" } },
        ),
      );
    }
  },
} satisfies ExportedHandler<Env>;
