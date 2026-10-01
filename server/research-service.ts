import { z } from "zod";
import { notebookSchema } from "./schema";
import type { Trip } from "../src/domain";
import {
  researchFingerprint,
  researchItemId,
  type ResearchJob,
  type Source,
  type Proposal,
  type Provider,
} from "../src/research";
import {
  ResearchError,
  providerConfig,
  reserve,
  type ResearchEnv,
} from "./connections";
import { searchSources, readSources, generateProposal } from "./research-tools";
type Payload = {
  trip: Trip;
  sources: Source[];
  result: Proposal | null;
  warnings: string[];
};
type Row = {
  id: string;
  trip_id: string;
  fingerprint: string;
  provider: Provider;
  model: string;
  status: ResearchJob["status"];
  stage: number;
  lease_until: number;
  payload: string;
  error: string;
  created_at: number;
};
const startSchema = z
  .object({ tripId: z.string().min(1).max(100), requestId: z.string().uuid() })
  .strict();
const stepSchema = z
  .object({ id: z.string().uuid(), stage: z.number().int().min(0).max(4) })
  .strict();
const idSchema = z.object({ id: z.string().uuid() }).strict();
async function notebook(env: ResearchEnv) {
  const row = await env.DB.prepare(
    "SELECT payload FROM notebook WHERE id='owner'",
  ).first<{ payload: string }>();
  const data = notebookSchema.safeParse(row ? JSON.parse(row.payload) : null);
  if (!data.success)
    throw new ResearchError(
      422,
      "Guarda primero un viaje para poder investigarlo.",
    );
  return data.data;
}
async function read(env: ResearchEnv, id: string) {
  return env.DB.prepare(
    "SELECT * FROM research_jobs WHERE id=? AND owner_id='owner'",
  )
    .bind(id)
    .first<Row>();
}
function view(row: Row): ResearchJob {
  const payload = JSON.parse(row.payload) as Payload;
  return {
    id: row.id,
    tripId: row.trip_id,
    fingerprint: row.fingerprint,
    provider: row.provider,
    model: row.model,
    status: row.status,
    stage: row.stage,
    leaseUntil: row.lease_until,
    error: row.error,
    createdAt: row.created_at,
    sources: payload.sources,
    result: payload.result,
    warnings: payload.warnings,
  };
}
export async function latestResearch(env: ResearchEnv, tripId: string) {
  const row = await env.DB.prepare(
    "SELECT * FROM research_jobs WHERE owner_id='owner' AND trip_id=? ORDER BY created_at DESC LIMIT 1",
  )
    .bind(tripId)
    .first<Row>();
  return row ? view(row) : null;
}
// Keep only references in the notebook. The completed dossier remains the source
// of truth, so saving a visit cannot rewrite its evidence or verification state.
export async function validateResearchSelections(
  env: ResearchEnv,
  trips: Trip[],
  previous: Trip[],
) {
  const jobs = new Map<string, Row | null>();
  for (const trip of trips) {
    const old = new Set(
      previous
        .find((t) => t.id === trip.id)
        ?.researchSelections?.map(researchItemId),
    );
    for (const ref of trip.researchSelections ?? []) {
      if (old.has(researchItemId(ref))) continue;
      if (!jobs.has(ref.jobId)) jobs.set(ref.jobId, await read(env, ref.jobId));
      const row = jobs.get(ref.jobId);
      if (!row || row.trip_id !== trip.id || row.status !== "done")
        throw new ResearchError(
          422,
          "La propuesta no pertenece a una investigación terminada de este viaje.",
        );
      const job = view(row);
      if (!job.result?.[ref.kind][ref.index])
        throw new ResearchError(
          422,
          "La propuesta elegida ya no está disponible.",
        );
      if (row.fingerprint !== researchFingerprint(trip))
        throw new ResearchError(
          422,
          "El viaje ha cambiado. Investiga sus nuevos detalles antes de guardar propuestas.",
        );
    }
  }
}
export async function researchLibrary(env: ResearchEnv, tripId: string) {
  const data = await notebook(env);
  const trip = data.trips.find((t) => t.id === tripId);
  if (!trip) throw new ResearchError(404, "El viaje ya no existe.");
  const jobs: ResearchJob[] = [];
  for (const id of new Set(trip.researchSelections?.map((r) => r.jobId))) {
    const row = await read(env, id);
    if (!row || row.trip_id !== tripId || row.status !== "done")
      throw new ResearchError(
        503,
        "No podemos abrir una propuesta guardada. Vuelve a cargar las fuentes.",
      );
    const job = view(row);
    // The literal quote is retained in each proposal. Avoid transmitting full
    // extracted pages each time the notebook is opened on a mobile connection.
    jobs.push({
      ...job,
      sources: job.sources.map((s) => ({ ...s, text: "" })),
    });
  }
  return jobs;
}
export async function startResearch(env: ResearchEnv, input: unknown) {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success)
    throw new ResearchError(400, "La petición de investigación no es válida.");
  const { tripId, requestId } = parsed.data;
  const existing = await read(env, requestId);
  if (existing) {
    if (existing.trip_id !== tripId)
      throw new ResearchError(
        409,
        "Ese identificador pertenece a otra investigación.",
      );
    return view(existing);
  }
  const data = await notebook(env);
  const trip = data.trips.find((t) => t.id === tripId);
  if (!trip) throw new ResearchError(404, "El viaje ya no existe.");
  const provider = data.provider;
  const config = providerConfig(env, provider);
  if (!env.TAVILY_API_KEY)
    throw new ResearchError(
      422,
      "Configura la clave de Tavily en Cloudflare antes de investigar.",
    );
  const active = await env.DB.prepare(
    "SELECT * FROM research_jobs WHERE owner_id='owner' AND status IN ('ready','running') LIMIT 1",
  ).first<Row>();
  if (active) {
    if (
      active.trip_id === tripId &&
      active.fingerprint === researchFingerprint(trip) &&
      active.provider === provider
    )
      return view(active);
    throw new ResearchError(
      409,
      "Hay otra investigación pendiente. Reanúdala o cancélala antes de empezar otra.",
    );
  }
  const now = Date.now();
  const payload: Payload = { trip, sources: [], result: null, warnings: [] };
  try {
    await env.DB.prepare(
      "INSERT INTO research_jobs(id,owner_id,trip_id,fingerprint,provider,model,status,payload,created_at,updated_at) VALUES (?,'owner',?,?,?,?, 'ready',?,?,?)",
    )
      .bind(
        requestId,
        tripId,
        researchFingerprint(trip),
        provider,
        config.model,
        JSON.stringify(payload),
        now,
        now,
      )
      .run();
  } catch (error) {
    const race = await read(env, requestId);
    if (race) return view(race);
    const active = await env.DB.prepare(
      "SELECT id FROM research_jobs WHERE owner_id='owner' AND status IN ('ready','running') LIMIT 1",
    ).first();
    if (active)
      throw new ResearchError(
        409,
        "Otra investigación se ha iniciado. Recarga para ver su estado.",
      );
    throw error;
  }
  return view((await read(env, requestId))!);
}
export async function cancelResearch(env: ResearchEnv, input: unknown) {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success)
    throw new ResearchError(400, "La petición no es válida.");
  await env.DB.prepare(
    "UPDATE research_jobs SET status='cancelled',updated_at=? WHERE id=? AND owner_id='owner' AND status IN ('ready','running','error')",
  )
    .bind(Date.now(), parsed.data.id)
    .run();
  const row = await read(env, parsed.data.id);
  if (!row) throw new ResearchError(404, "La investigación ya no existe.");
  return view(row);
}
export async function stepResearch(env: ResearchEnv, input: unknown) {
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success)
    throw new ResearchError(400, "El paso de investigación no es válido.");
  const { id, stage } = parsed.data;
  const row = await read(env, id);
  if (!row) throw new ResearchError(404, "La investigación ya no existe.");
  if (
    row.stage !== stage ||
    row.status === "done" ||
    row.status === "cancelled"
  )
    return view(row);
  if (row.status === "running" && row.lease_until > Date.now())
    return view(row);
  const current = await notebook(env);
  const trip = current.trips.find((t) => t.id === row.trip_id);
  if (!trip || researchFingerprint(trip) !== row.fingerprint) {
    await cancelResearch(env, { id });
    throw new ResearchError(
      409,
      "Los datos del viaje han cambiado. Inicia una investigación con las nuevas fechas y condiciones.",
    );
  }
  providerConfig(env, row.provider);
  if (!env.TAVILY_API_KEY)
    throw new ResearchError(422, "Falta la conexión con Tavily.");
  const lease = Date.now() + 120000;
  const claimed = await env.DB.prepare(
    "UPDATE research_jobs SET status='running',lease_until=?,error='',updated_at=? WHERE id=? AND stage=? AND (status IN ('ready','error') OR (status='running' AND lease_until < ?)) RETURNING id",
  )
    .bind(lease, Date.now(), id, stage, Date.now())
    .first();
  if (!claimed) return view((await read(env, id))!);
  const payload = JSON.parse(row.payload) as Payload;
  try {
    await reserve(env, stage < 4 ? "search" : "ai");
    if (stage < 3)
      payload.sources = await searchSources(
        env,
        payload.trip,
        stage,
        payload.sources,
      );
    else if (stage === 3)
      payload.sources = await readSources(env, payload.trip, payload.sources);
    else {
      if (!payload.sources.length)
        throw new ResearchError(
          422,
          "No se encontraron fuentes suficientes. No generamos una propuesta sin referencias.",
        );
      payload.result = await generateProposal(
        env,
        row.provider,
        row.model,
        payload.trip,
        payload.sources,
        row.id,
      );
      payload.warnings = [
        "Lectura parcial: hasta cinco páginas. La cobertura de agendas no es exhaustiva.",
        "Precios, horarios para tus fechas, funciones y entradas disponibles requieren comprobación específica.",
        "La propuesta de IA organiza fuentes; no constituye una reserva ni una validación de todos sus datos.",
      ];
    }
    const fresh = await notebook(env);
    const changed = fresh.trips.find((t) => t.id === row.trip_id);
    if (!changed || researchFingerprint(changed) !== row.fingerprint) {
      await cancelResearch(env, { id });
      return view((await read(env, id))!);
    }
    await env.DB.prepare(
      "UPDATE research_jobs SET payload=?,stage=stage+1,status=?,lease_until=0,updated_at=? WHERE id=? AND status='running' AND lease_until=?",
    )
      .bind(
        JSON.stringify(payload),
        stage === 4 ? "done" : "ready",
        Date.now(),
        id,
        lease,
      )
      .run();
  } catch (error) {
    const message =
      error instanceof ResearchError
        ? error.message
        : "No se ha podido completar este paso. Las fuentes anteriores se conservan.";
    await env.DB.prepare(
      "UPDATE research_jobs SET status='error',error=?,lease_until=0,updated_at=? WHERE id=? AND status='running' AND lease_until=?",
    )
      .bind(message, Date.now(), id, lease)
      .run();
  }
  return view((await read(env, id))!);
}
