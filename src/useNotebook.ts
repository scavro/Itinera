import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, ApiError, type Notebook } from "./api";
import { SessionBlocked } from "./sessionContext";
type State =
  "loading" | "saved" | "pending" | "saving" | "error" | "conflict" | "expired";
const empty: Notebook = { trips: [], active: "", provider: "OpenAI" };
export function useNotebook(onExpired: () => void) {
  const [data, setData] = useState<Notebook>(empty);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");
  const blocked = useContext(SessionBlocked);
  const current = useRef(data);
  const saved = useRef(JSON.stringify(empty));
  const version = useRef(0);
  const running = useRef<Promise<void> | null>(null);
  const mutation = useRef<{ payload: string; id: string } | null>(null);
  const ready = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const expired = useRef(onExpired);
  expired.current = onExpired;
  useEffect(() => {
    if (!blocked && state === "expired") {
      setError("");
      setState(
        saved.current !== JSON.stringify(current.current) ? "pending" : "saved",
      );
    }
  }, [blocked, state]);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    if (running.current) await running.current.catch(() => {});
    setState("loading");
    setError("");
    try {
      const result = await api<{ data: Notebook; version: number }>(
        "/api/notebook",
      );
      if (!mounted.current || ticket !== generation.current) return;
      current.current = result.data;
      saved.current = JSON.stringify(result.data);
      version.current = result.version;
      mutation.current = null;
      ready.current = true;
      setData(result.data);
      setState("saved");
    } catch (e) {
      if (mounted.current && ticket === generation.current) {
        setError((e as Error).message);
        setState("error");
        if (e instanceof ApiError && e.status === 401) expired.current();
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [load]);
  const handleError = (e: unknown) => {
    const failure = e as ApiError;
    setError(failure.message);
    setState(
      failure.status === 409
        ? "conflict"
        : failure.status === 401
          ? "expired"
          : "error",
    );
    if (failure.status === 401) expired.current();
  };
  const flush = useCallback(async () => {
    if (!ready.current) return;
    if (running.current) return running.current;
    const operation = (async () => {
      try {
        while (saved.current !== JSON.stringify(current.current)) {
          const payload = JSON.stringify(current.current);
          if (mutation.current?.payload !== payload)
            mutation.current = { payload, id: crypto.randomUUID() };
          setState("saving");
          setError("");
          const result = await api<{ version: number }>("/api/notebook", {
            method: "PUT",
            body: JSON.stringify({
              data: JSON.parse(payload),
              version: version.current,
              mutationId: mutation.current.id,
            }),
          });
          version.current = result.version;
          saved.current = payload;
          mutation.current = null;
        }
        if (mounted.current) setState("saved");
      } catch (e) {
        if (mounted.current) handleError(e);
        throw e;
      }
    })();
    running.current = operation;
    try {
      await operation;
    } finally {
      running.current = null;
    }
  }, []);
  const change = useCallback((transform: (data: Notebook) => Notebook) => {
    const next = transform(current.current);
    current.current = next;
    setData(next);
    setState((s) =>
      ["error", "conflict", "expired"].includes(s) ? s : "pending",
    );
  }, []);
  useEffect(() => {
    if (state !== "pending") return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [data, state, flush]);
  const retry = useCallback(() => {
    if (!ready.current) {
      void load();
      return;
    }
    void flush().catch(() => {});
  }, [flush, load]);
  // Destructive writes and form submits commit only after server confirmation.
  const commit = useCallback(
    async (transform: (data: Notebook) => Notebook) => {
      await flush();
      const previous = current.current;
      const next = transform(previous);
      const payload = JSON.stringify(next);
      setState("saving");
      setError("");
      if (mutation.current?.payload !== payload)
        mutation.current = { payload, id: crypto.randomUUID() };
      const id = mutation.current.id;
      const operation = (async () => {
        try {
          const result = await api<{ version: number }>("/api/notebook", {
            method: "PUT",
            body: JSON.stringify({
              data: next,
              version: version.current,
              mutationId: id,
            }),
          });
          version.current = result.version;
          saved.current = payload;
          current.current = next;
          mutation.current = null;
          setData(next);
          setState("saved");
        } catch (e) {
          handleError(e);
          throw e;
        }
      })();
      running.current = operation;
      try {
        await operation;
      } finally {
        running.current = null;
      }
    },
    [flush],
  );
  return {
    data,
    change,
    commit,
    state,
    error,
    retry,
    load,
    flush,
    ready: ready.current,
    dirty: saved.current !== JSON.stringify(data),
  };
}
