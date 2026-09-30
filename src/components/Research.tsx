import { SessionBlocked } from "../sessionContext";
import {
  parseResearchResponse,
  parseConnectionsResponse,
  assertResearchProgress,
} from "../researchSchema";
import { useCallback, useEffect, useContext, useRef, useState } from "react";
import { BookOpen, ExternalLink, Search, Square, Sparkles } from "lucide-react";
import { api, ApiError } from "../api";
import {
  researchFingerprint,
  researchStages,
  type Connections,
  type ResearchJob,
  type ProposalItem,
  type Source,
} from "../research";
import type { Trip } from "../domain";
import { Button } from "./ui";
export function useConnections(onExpired: () => void) {
  const blocked = useContext(SessionBlocked);
  const [data, setData] = useState<Connections | null>(null);
  const [error, setError] = useState("");
  const expired = useRef(onExpired);
  expired.current = onExpired;
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const ticket = ++sequence.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setError("");
    try {
      const result = await api<Connections>("/api/connections", {
        signal: controller.signal,
      });
      if (ticket === sequence.current)
        setData(parseConnectionsResponse(result));
    } catch (e) {
      if (ticket !== sequence.current || controller.signal.aborted) return;
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 401) expired.current();
    }
  }, []);
  useEffect(() => {
    if (blocked) return;
    void refresh();
    return () => {
      sequence.current++;
      request.current?.abort();
    };
  }, [refresh, blocked]);
  return { data, error, refresh };
}
export function ConnectionStatus({
  data,
  error,
  retry,
}: {
  data: Connections | null;
  error: string;
  retry: () => void;
}) {
  return (
    <section className="panel research-connection">
      <div className="section-heading">
        <h2>IA y fuentes</h2>
        <Search size={21} />
      </div>
      {!data && !error && <p role="status">Comprobando conexiones…</p>}
      {error && (
        <div className="notice" role="alert">
          {error} <Button onClick={retry}>Volver a comprobar</Button>
        </div>
      )}
      {data && (
        <>
          <div className="connection-row">
            <span>Buscador</span>
            <strong>
              Tavily ·{" "}
              {data.search.configured
                ? "Clave configurada"
                : "Pendiente de configurar"}
            </strong>
          </div>
          <div className="connection-row">
            <span>Consultas reservadas este mes</span>
            <strong>
              {data.search.used} / {data.search.limit}
            </strong>
          </div>
          <div className="connection-row">
            <span>Propuestas reservadas este mes</span>
            <strong>
              {data.ai.used} / {data.ai.limit}
            </strong>
          </div>
          <p>
            La cuota incluye intentos fallidos para evitar exceder el límite
            ante respuestas inciertas. Las claves se guardan en Cloudflare. Una
            clave configurada no acredita todavía una consulta correcta.
          </p>
        </>
      )}
      <Button onClick={retry}>Comprobar conexiones</Button>
    </section>
  );
}
function References({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return (
    <ul className="research-references">
      {ids.map((id) => {
        const s = sources.find((s) => s.id === id);
        return s ? (
          <li key={id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
              <ExternalLink size={14} />
            </a>
          </li>
        ) : null;
      })}
    </ul>
  );
}
function ProposalList({
  title,
  items,
  sources,
}: {
  title: string;
  items: ProposalItem[];
  sources: Source[];
}) {
  return (
    <section className="research-section">
      <h3>{title}</h3>
      {!items.length ? (
        <p>
          No se han obtenido propuestas suficientes en las fuentes consultadas.
        </p>
      ) : (
        <div className="research-card-grid">
          {items.map((item, index) => (
            <article className="research-item" key={`${item.title}-${index}`}>
              <span className="eyebrow">
                {item.category} · {item.area}
              </span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              {item.quote && (
                <blockquote>
                  <p>«{item.quote}»</p>
                  <small>Fragmento de la fuente · lectura parcial</small>
                </blockquote>
              )}
              <References ids={item.sourceIds} sources={sources} />
              <small className="research-pending">
                Datos para tus fechas pendientes de comprobación.
              </small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export function ResearchPanel({
  trip,
  provider,
  connections,
  beforeStart,
  onExpired,
  onChanged,
  focus = "all",
}: {
  trip: Trip;
  provider: string;
  connections: Connections | null;
  beforeStart: () => Promise<void>;
  onExpired: () => void;
  onChanged: () => void;
  focus?: "all" | "culture" | "food";
}) {
  const blocked = useContext(SessionBlocked);
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancelActive = useRef(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const mounted = useRef(true);
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const pendingId = useRef<string | null>(null);
  const loadSequence = useRef(0);
  const loadController = useRef<AbortController | null>(null);
  const effectiveProvider =
    job && !["done", "cancelled"].includes(job.status)
      ? job.provider
      : provider;
  const stale = !!job && job.fingerprint !== researchFingerprint(trip);
  const configured =
    !!connections?.providers.find(
      (p) => p.name === effectiveProvider && p.configured && p.enabled,
    ) && !!connections?.search.configured;
  const handleError = (e: unknown) => {
    if (!mounted.current) return;
    setError((e as Error).message);
    if (e instanceof ApiError && e.status === 401) onExpired();
  };
  const load = useCallback(async () => {
    const ticket = ++loadSequence.current;
    loadController.current?.abort();
    const request = new AbortController();
    loadController.current = request;
    setLoading(true);
    setError("");
    try {
      const result = await api<{ job: ResearchJob | null }>(
        `/api/research?tripId=${encodeURIComponent(trip.id)}`,
        { signal: request.signal },
      );
      if (mounted.current && ticket === loadSequence.current) {
        const found = parseResearchResponse(result).job;
        setJob(found);
        if (found?.id === pendingId.current) pendingId.current = null;
      }
    } catch (e) {
      if (ticket === loadSequence.current && !request.signal.aborted)
        handleError(e);
    } finally {
      if (mounted.current && ticket === loadSequence.current) setLoading(false);
    }
  }, [trip.id]);
  useEffect(() => {
    if (blocked) return;
    mounted.current = true;
    active.current = false;
    cancelActive.current = false;
    setBusy(false);
    setCancelling(false);
    void load();
    return () => {
      mounted.current = false;
      generation.current++;
      loadSequence.current++;
      loadController.current?.abort();
      active.current = false;
      controller.current?.abort();
    };
  }, [load, blocked]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (active.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  async function run(existing?: ResearchJob) {
    if (active.current || cancelActive.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    const ticket = ++generation.current;
    const live = () =>
      mounted.current && active.current && ticket === generation.current;
    try {
      await beforeStart();
      if (!live()) return;
      let next: ResearchJob;
      if (existing) next = existing;
      else {
        pendingId.current ??= crypto.randomUUID();
        const result = await api<{ job: ResearchJob }>("/api/research/start", {
          method: "POST",
          body: JSON.stringify({
            tripId: trip.id,
            requestId: pendingId.current,
          }),
          signal: controller.current.signal,
        });
        const parsed = parseResearchResponse(result).job;
        if (!parsed)
          throw new ApiError(
            0,
            "La investigación no está disponible. Actualiza su estado.",
          );
        next = parsed;
        pendingId.current = null;
      }
      if (live()) setJob(next);
      let steps = 0;
      while (live() && !["done", "cancelled"].includes(next.status)) {
        if (steps >= 5)
          throw new ApiError(
            0,
            "Hemos detenido las consultas al alcanzar el límite de etapas. Actualiza su estado antes de reanudar.",
          );
        steps++;
        const previous = next;
        const result = await api<{ job: ResearchJob }>("/api/research/step", {
          method: "POST",
          body: JSON.stringify({ id: next.id, stage: next.stage }),
          signal: AbortSignal.any([
            controller.current.signal,
            AbortSignal.timeout(80000),
          ]),
        });
        if (!live()) break;
        const parsed = parseResearchResponse(result).job;
        if (!parsed)
          throw new ApiError(
            0,
            "La investigación no está disponible. Actualiza su estado.",
          );
        assertResearchProgress(previous, parsed, steps);
        next = parsed;
        setJob(next);
        onChanged();
        if (next.status === "running") {
          setError(
            "Hay una consulta anterior que todavía puede estar activa. Espera unos momentos y pulsa Reanudar; conservamos su estado.",
          );
          break;
        }
        if (next.status === "error") {
          setError(next.error);
          break;
        }
      }
    } catch (e) {
      if (live()) handleError(e);
    } finally {
      if (ticket === generation.current) {
        active.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }
  async function cancel() {
    if (!job || cancelActive.current) return;
    cancelActive.current = true;
    setCancelling(true);
    const ticket = ++generation.current;
    active.current = false;
    controller.current?.abort();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ job: ResearchJob }>("/api/research/cancel", {
        method: "POST",
        body: JSON.stringify({ id: job.id }),
      });
      if (mounted.current && ticket === generation.current)
        setJob(parseResearchResponse(result).job);
    } catch (e) {
      if (ticket === generation.current) handleError(e);
    } finally {
      if (ticket === generation.current) {
        cancelActive.current = false;
        if (mounted.current) {
          setBusy(false);
          setCancelling(false);
          onChanged();
        }
      }
    }
  }
  return (
    <section className="panel research-panel" aria-busy={busy}>
      <div className="assistant-heading">
        <Sparkles size={22} />
        <span>Tu asistente de viaje</span>
        <span className="badge">
          {job?.status === "done"
            ? "Propuesta guardada"
            : configured
              ? "Listo para investigar"
              : "Conexión pendiente"}
        </span>
      </div>
      <h2>
        {focus === "food"
          ? "Los sabores de tu destino."
          : focus === "culture"
            ? "Cultura con fuentes."
            : "Del destino a los descubrimientos."}
      </h2>
      <p>
        Museos de historia y arte, patrimonio romano, ópera, lugares
        emblemáticos y comidas del país y la región. Sin recomendaciones de
        restaurantes.
      </p>
      {!configured && (
        <div className="notice">
          Configura {effectiveProvider} y Tavily en Cloudflare. En Ajustes
          puedes comprobar las conexiones. Investigar enviará al proveedor
          elegido los datos de este viaje y las fuentes localizadas.
        </div>
      )}
      <p className="research-caption">
        Al investigar, se enviarán los datos de este viaje y las fuentes al
        proveedor elegido. Precios y entradas siguen pendientes de comprobación.
      </p>
      {loading && <p role="status">Abriendo la investigación guardada…</p>}
      {error && (
        <div className="notice research-error" role="alert">
          {error}
        </div>
      )}
      {!loading && (
        <div className="research-actions">
          {!job || ["done", "cancelled"].includes(job.status) ? (
            <Button
              variant="primary"
              disabled={busy || !configured}
              onClick={() => void run()}
            >
              <Search size={17} />
              {busy
                ? "Investigando…"
                : job
                  ? "Investigar de nuevo"
                  : "Investigar este viaje"}
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                disabled={busy || stale || !configured}
                onClick={() => void run(job)}
              >
                <BookOpen size={17} />
                {busy ? "Investigando…" : "Reanudar investigación"}
              </Button>
              <Button disabled={cancelling} onClick={() => void cancel()}>
                <Square size={15} />
                Cancelar investigación
              </Button>
            </>
          )}
          {!busy && (
            <Button variant="ghost" onClick={() => void load()}>
              Actualizar estado
            </Button>
          )}
        </div>
      )}
      {stale && (
        <div className="notice">
          Esta investigación corresponde a condiciones anteriores. Cancela la
          investigación pendiente o inicia otra para las nuevas fechas y datos.
        </div>
      )}
      {job && (
        <>
          <p className="research-progress" role="status">
            {job.status === "done"
              ? "Propuesta guardada"
              : job.status === "cancelled"
                ? "Investigación cancelada. Se conservan las fuentes obtenidas."
                : `${researchStages[Math.min(job.stage, 4)]}${busy ? "…" : " · pendiente"}`}{" "}
            · {job.provider} · {job.model}
          </p>
          <p className="research-caption">
            Consulta iniciada el{" "}
            {new Intl.DateTimeFormat("es-ES", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(job.createdAt)}
            . Cada consulta nueva puede consumir cuota. Si cierras esta página,
            el paso ya enviado puede terminar; los siguientes se reanudan al
            volver.
          </p>
          {job.result && (
            <>
              {focus === "all" && (
                <p className="research-summary">{job.result.summary}</p>
              )}
              {focus !== "food" && (
                <>
                  <ProposalList
                    title="Museos, Roma y lugares emblemáticos"
                    items={job.result.visits}
                    sources={job.sources}
                  />
                  <ProposalList
                    title="Agendas culturales y ópera por revisar"
                    items={job.result.agendas}
                    sources={job.sources}
                  />
                </>
              )}
              {focus !== "culture" && (
                <ProposalList
                  title="Gastronomía del país y la región"
                  items={job.result.foods}
                  sources={job.sources}
                />
              )}
              <section className="research-section">
                <h3>Lo que queda por comprobar</h3>
                <ul>
                  {[...job.warnings, ...job.result.pending].map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
          {job.sources.length > 0 && (
            <details className="research-sources">
              <summary>
                {job.sources.length} fuentes localizadas · ver cobertura y
                lectura
              </summary>
              <ul>
                {job.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                      <ExternalLink size={14} />
                    </a>
                    <p>
                      {s.topic} ·{" "}
                      {s.read === "page"
                        ? "Texto consultado parcialmente"
                        : s.read === "unavailable"
                          ? "Lectura no disponible · resultado de buscador"
                          : "Resultado de buscador · página sin leer"}{" "}
                      ·{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(s.consultedAt))}
                    </p>
                    <small>
                      {new URL(s.url).hostname} · Titularidad oficial por
                      confirmar
                    </small>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
