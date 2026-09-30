import { sessionResponseSchema } from "./schema";
import { useCallback, useEffect, useRef, useState } from "react";
import App from "./App";
import { Login } from "./components/Login";
import { Logo } from "./components/Logo";
import { Button } from "./components/ui";
import { api, ApiError } from "./api";
import { SessionBlocked } from "./sessionContext";
export default function Root() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const check = useCallback(async (interactive = false) => {
    const ticket = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setError("");
    try {
      const parsed = sessionResponseSchema.safeParse(
        await api<unknown>("/api/session", {
          signal: AbortSignal.any([
            controller.current.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
      );
      if (ticket !== sequence.current) return;
      if (!parsed.success)
        throw new ApiError(
          0,
          "No se ha podido comprobar la sesión. Vuelve a intentarlo.",
        );
      const result = parsed.data;
      setUsername(result.username);
      setExpiresAt(result.expiresAt);
      setLocked(false);
      if (location.pathname === "/login")
        history.replaceState(null, "", "/" + location.hash);
    } catch (e) {
      if (ticket !== sequence.current) return;
      if (e instanceof ApiError && e.status === 401) setLocked(true);
      else if (interactive) throw e;
      else setError((e as Error).message);
    } finally {
      if (ticket === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void check();
    const channel = new BroadcastChannel("itinera-session");
    channel.onmessage = (e) => {
      if (e.data === "logout") {
        sequence.current++;
        controller.current?.abort();
        setLoading(false);
        setUsername("");
        setLocked(true);
      }
    };
    return () => {
      sequence.current++;
      controller.current?.abort();
      channel.close();
    };
  }, [check]);
  useEffect(() => {
    if (!username || !expiresAt || locked) return;
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(
      () => setLocked(true),
      Math.min(2147483647, Math.max(0, expiry - Date.now())),
    );
    return () => clearTimeout(timer);
  }, [username, expiresAt, locked]);
  if (loading || error)
    return (
      <main className="connection-screen">
        <Logo />
        <h1>
          {error ? "Tu cuaderno está esperando." : "Abriendo tu cuaderno…"}
        </h1>
        <p role={error ? "alert" : "status"}>
          {error || "Comprobando tu sesión."}
        </p>
        {error && (
          <Button
            onClick={() => {
              setLoading(true);
              void check();
            }}
          >
            Volver a intentar
          </Button>
        )}
      </main>
    );
  return (
    <SessionBlocked.Provider value={locked}>
      {username && (
        <div hidden={locked}>
          <App
            username={username}
            onExpired={() => setLocked(true)}
            onLogout={() => {
              sequence.current++;
              controller.current?.abort();
              setUsername("");
              setLocked(true);
              history.replaceState(null, "", "/login");
            }}
          />
        </div>
      )}
      {(locked || !username) && (
        <Login expired={!!username} onSuccess={() => check(true)} />
      )}
    </SessionBlocked.Provider>
  );
}
