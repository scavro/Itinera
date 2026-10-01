import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api, ApiError } from "./api";
import { SessionBlocked } from "./sessionContext";
import type { Trip } from "./domain";
import { researchItemId, type ResearchJob } from "./research";
import { researchJobSchema } from "./researchSchema";
const librarySchema = z
  .object({ jobs: z.array(researchJobSchema).max(5) })
  .strict();
export function useResearchLibrary(
  trip: Trip | undefined,
  onExpired: () => void,
) {
  const blocked = useContext(SessionBlocked);
  const [state, setState] = useState<{
    key: string;
    jobs: ResearchJob[];
    loading: boolean;
    error: string;
  }>({ key: "", jobs: [], loading: false, error: "" });
  const current = useRef(trip);
  current.current = trip;
  const expired = useRef(onExpired);
  expired.current = onExpired;
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const key = `${trip?.id ?? ""}:${trip?.researchSelections?.map(researchItemId).join(",") ?? ""}`;
  const load = useCallback(async () => {
    const ticket = ++sequence.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const t = current.current;
    if (!t?.researchSelections?.length) {
      setState({ key, jobs: [], loading: false, error: "" });
      return;
    }
    setState({ key, jobs: [], loading: true, error: "" });
    try {
      const raw = await api<unknown>(
        `/api/research/library?tripId=${encodeURIComponent(t.id)}`,
        { signal: controller.signal },
      );
      const parsed = librarySchema.safeParse(raw);
      if (
        !parsed.success ||
        t.researchSelections.some(
          (ref) =>
            !parsed.data.jobs.some(
              (j) =>
                j.id === ref.jobId &&
                j.tripId === t.id &&
                j.status === "done" &&
                !!j.result?.[ref.kind][ref.index],
            ),
        )
      )
        throw new Error(
          "No podemos interpretar las fichas guardadas. Vuelve a cargar sus fuentes.",
        );
      if (ticket === sequence.current)
        setState({ key, jobs: parsed.data.jobs, loading: false, error: "" });
    } catch (e) {
      if (ticket !== sequence.current || controller.signal.aborted) return;
      setState({ key, jobs: [], loading: false, error: (e as Error).message });
      if (e instanceof ApiError && e.status === 401) expired.current();
    }
  }, [key]);
  useEffect(() => {
    if (blocked) return;
    void load();
    return () => {
      sequence.current++;
      request.current?.abort();
    };
  }, [load, blocked]);
  return {
    jobs: state.key === key ? state.jobs : [],
    loading: state.key !== key || state.loading,
    error: state.key === key ? state.error : "",
    retry: load,
  };
}
