import { z } from "zod";
import { ApiError } from "./api";
import type { Connections, ResearchJob } from "./research";
const entrySchema = z
  .object({
    title: z.string().min(1).max(150),
    area: z.string().max(120),
    category: z.enum([
      "Museo de historia",
      "Museo de arte",
      "Patrimonio romano",
      "Emblemático",
      "Agenda cultural",
      "Ópera",
      "Gastronomía nacional",
      "Gastronomía regional",
    ]),
    description: z.string().max(1000),
    sourceIds: z.array(z.string().max(20)).min(1).max(6),
    quote: z.string().max(300),
    quoteSourceId: z.string().max(20),
  })
  .strict();
export const proposalSchema = z
  .object({
    summary: z.string().max(2000),
    visits: z.array(entrySchema).max(10),
    agendas: z.array(entrySchema).max(8),
    foods: z.array(entrySchema).max(8),
    pending: z.array(z.string().max(300)).max(12),
  })
  .strict();

const date = z.string().refine((value) => Number.isFinite(Date.parse(value)));
const source = z
  .object({
    id: z.string().min(1).max(20),
    title: z.string().max(300),
    url: z.string().refine((value) => {
      try {
        const u = new URL(value);
        return u.protocol === "https:" && !u.username && !u.password;
      } catch {
        return false;
      }
    }),
    text: z.string().max(3000),
    topic: z.enum(["cultura", "agenda", "gastronomía"]),
    read: z.enum(["search", "page", "unavailable"]),
    consultedAt: date,
  })
  .strict();
export const researchJobSchema = z
  .object({
    id: z.string().uuid(),
    tripId: z.string().min(1).max(100),
    fingerprint: z.string().max(5000),
    provider: z.enum(["Gemini", "OpenAI", "OpenCode Go"]),
    model: z.string().max(150),
    status: z.enum(["ready", "running", "done", "error", "cancelled"]),
    stage: z.number().int().min(0).max(5),
    leaseUntil: z.number().nonnegative(),
    error: z.string().max(1000),
    createdAt: z.number().nonnegative(),
    sources: z.array(source).max(90),
    result: proposalSchema.nullable(),
    warnings: z.array(z.string().max(1000)).max(100),
  })
  .strict();
export function parseResearchResponse(value: unknown): {
  job: ResearchJob | null;
} {
  const result = z
    .object({ job: researchJobSchema.nullable() })
    .strict()
    .safeParse(value);
  if (!result.success)
    throw new ApiError(
      0,
      "La investigación recibida no tiene un formato válido. Vuelve a actualizar su estado.",
    );
  return result.data;
}
export function assertResearchProgress(
  previous: ResearchJob,
  next: ResearchJob,
  steps: number,
) {
  if (
    next.id !== previous.id ||
    steps > 5 ||
    (!["done", "cancelled", "running", "error"].includes(next.status) &&
      next.stage <= previous.stage)
  )
    throw new ApiError(
      0,
      "La investigación no ha avanzado como se esperaba. Hemos detenido las consultas; actualiza su estado antes de reanudar.",
    );
}

export function parseConnectionsResponse(value: unknown): Connections {
  const count = z.number().int().nonnegative();
  const parsed = z
    .object({
      providers: z
        .array(
          z
            .object({
              name: z.enum(["Gemini", "OpenAI", "OpenCode Go"]),
              configured: z.boolean(),
              model: z.string().max(150),
              enabled: z.boolean(),
            })
            .strict(),
        )
        .max(3),
      search: z
        .object({
          name: z.string().min(1).max(100),
          configured: z.boolean(),
          used: count,
          limit: count,
        })
        .strict(),
      ai: z.object({ used: count, limit: count }).strict(),
    })
    .strict()
    .safeParse(value);
  if (!parsed.success)
    throw new ApiError(
      0,
      "El estado de las conexiones no tiene un formato válido. Vuelve a actualizarlo.",
    );
  return parsed.data;
}
