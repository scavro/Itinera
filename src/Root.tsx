import { useCallback, useEffect, useState } from "react";
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
  const check = useCallback(async (interactive = false) => {
    setError("");
    try {
      const result = await api<{ username: string; expiresAt: string }>(
        "/api/session",
      );
      setUsername(result.username);
      setExpiresAt(result.expiresAt);
      setLocked(false);
      if (location.pathname === "/login")
        history.replaceState(null, "", "/" + location.hash);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setLocked(true);
      else if (interactive) throw e;
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void check();
    const channel = new BroadcastChannel("itinera-session");
    channel.onmessage = (e) => {
      if (e.data === "logout") {
        setUsername("");
        setLocked(true);
      }
    };
    return () => channel.close();
  }, [check]);
  useEffect(() => {
    if (!username || !expiresAt || locked) return;
    const timer = setTimeout(
      () => setLocked(true),
      Math.max(0, Date.parse(expiresAt) - Date.now()),
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
        <p role="status">{error || "Comprobando tu sesión."}</p>
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
