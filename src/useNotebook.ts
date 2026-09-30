import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";
import { SessionBlocked } from "./sessionContext";
import { NotebookStore } from "./notebookStore";
import { notebookResponseSchema, savedResponseSchema } from "./schema";
export function useNotebook(onExpired: () => void) {
  const [store] = useState(
    () =>
      new NotebookStore(async (request) => {
        const response = await api<unknown>("/api/notebook", {
          method: "PUT",
          body: JSON.stringify(request),
        });
        const parsed = savedResponseSchema.safeParse(response);
        if (!parsed.success)
          throw new ApiError(
            0,
            "El servidor ha devuelto una confirmación no válida. Reintenta para comprobar el guardado.",
          );
        return parsed.data;
      }),
  );
  const [snapshot, setSnapshot] = useState(store.snapshot);
  const blocked = useContext(SessionBlocked);
  const generation = useRef(0);
  const mounted = useRef(false);
  store.blocked = blocked;
  store.expired = () => {
    if (mounted.current) onExpired();
  };
  store.notify = () => {
    if (mounted.current) setSnapshot(store.snapshot);
  };
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    await store.idle();
    if (!mounted.current || ticket !== generation.current) return;
    store.loading();
    try {
      const parsed = notebookResponseSchema.safeParse(
        await api<unknown>("/api/notebook"),
      );
      if (!parsed.success)
        throw new ApiError(
          0,
          "El cuaderno del servidor no tiene un formato válido. Tus cambios locales se conservan; vuelve a intentar cargarlo.",
        );
      if (mounted.current && ticket === generation.current)
        store.reset(parsed.data.data, parsed.data.version);
    } catch (e) {
      if (mounted.current && ticket === generation.current) store.fail(e);
    }
  }, [store]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [load]);
  useEffect(() => {
    if (!blocked) store.resume();
  }, [blocked, store]);
  useEffect(() => {
    if (blocked || snapshot.state !== "pending") return;
    const timer = setTimeout(() => {
      void store.flush().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [blocked, snapshot, store]);
  const flush = useCallback(() => store.flush(), [store]);
  const commit = useCallback(
    (transform: Parameters<NotebookStore["commit"]>[0]) =>
      store.commit(transform),
    [store],
  );
  const change = useCallback(
    (transform: Parameters<NotebookStore["change"]>[0]) =>
      store.change(transform),
    [store],
  );
  const retry = useCallback(() => {
    if (!store.snapshot.ready) void load();
    else void flush().catch(() => {});
  }, [store, load, flush]);
  return { ...snapshot, load, flush, commit, change, retry };
}
