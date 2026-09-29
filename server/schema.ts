import { z } from "zod";
import { validDate } from "../src/domain";
const ids = z.array(z.string().min(1).max(100)).max(200);
export const tripSchema = z
  .object({
    id: z.string().min(1).max(100),
    destination: z.string().trim().min(1).max(100),
    origin: z.string().trim().min(1).max(100),
    start: z.string().refine(validDate),
    end: z.string().refine(validDate),
    travelers: z.number().int().min(1).max(12),
    budgetPerPerson: z.number().int().min(1).max(100000000),
    pace: z.enum(["Sin prisas", "Equilibrado", "Aprovechar cada día"]),
    notes: z.string().max(1500),
    selected: ids,
    interested: ids,
    tasted: ids,
    foodInterested: ids,
    checked: ids,
    days: z.record(z.string().max(100), z.string().refine(validDate)),
    demo: z.boolean(),
  })
  .strict()
  .refine(
    (t) =>
      t.end > t.start &&
      (Date.parse(t.end) - Date.parse(t.start)) / 86400000 <= 60,
  )
  .refine(
    (t) =>
      Object.keys(t.days).length <= 200 &&
      Object.values(t.days).every((d) => d >= t.start && d <= t.end),
  );
export const notebookSchema = z
  .object({
    trips: z.array(tripSchema).max(100),
    active: z.string().max(100),
    provider: z.enum(["OpenAI", "Gemini", "OpenCode Go"]),
  })
  .strict()
  .refine((n) => new Set(n.trips.map((t) => t.id)).size === n.trips.length)
  .refine((n) =>
    n.trips.length ? n.trips.some((t) => t.id === n.active) : n.active === "",
  );
export const saveSchema = z
  .object({
    data: notebookSchema,
    version: z.number().int().min(0),
    mutationId: z.string().uuid(),
  })
  .strict();
