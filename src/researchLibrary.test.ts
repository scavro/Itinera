import { describe, expect, it } from "vitest";
import { initialTrip, updateTripDates } from "./domain";
import {
  researchItemId,
  researchFingerprint,
  type ResearchJob,
} from "./research";
import {
  saveResearchItem,
  removeResearchItem,
  researchVisits,
} from "./researchLibrary";
import { tripSchema } from "./schema";
const job: ResearchJob = {
  id: "94bf8d20-95d6-435a-95da-062a6d1e00ba",
  tripId: initialTrip.id,
  fingerprint: researchFingerprint(initialTrip),
  provider: "Gemini",
  model: "fixture",
  status: "done",
  stage: 5,
  leaseUntil: 0,
  error: "",
  createdAt: 1,
  sources: [],
  warnings: ["Pendiente"],
  result: {
    summary: "Prueba",
    visits: [
      {
        title: "Museo",
        area: "Bari",
        category: "Museo de historia",
        description: "Colección",
        sourceIds: ["s1"],
        quote: "",
        quoteSourceId: "",
      },
    ],
    agendas: [],
    foods: [
      {
        title: "Plato",
        area: "Italia",
        category: "Gastronomía nacional",
        description: "Receta",
        sourceIds: ["s1"],
        quote: "",
        quoteSourceId: "",
      },
    ],
    pending: [],
  },
};
describe("saved research references", () => {
  it("keeps old notebooks compatible and does not duplicate saved entries", () => {
    expect(tripSchema.parse(initialTrip).researchSelections).toBeUndefined();
    const ref = { jobId: job.id, kind: "visits" as const, index: 0 };
    const saved = saveResearchItem(initialTrip, job, ref);
    expect(saveResearchItem(saved, job, ref)).toBe(saved);
    expect(saved.selected).toEqual(initialTrip.selected);
    expect(saved.interested).toContain(researchItemId(ref));
    expect(researchVisits(saved, [job])[0].research?.job).toBe(job);
    expect(
      tripSchema.safeParse({ ...saved, researchSelections: [ref, ref] })
        .success,
    ).toBe(false);
  });
  it("retains references and flags changed travel criteria instead of accepting stale imports", () => {
    const ref = { jobId: job.id, kind: "visits" as const, index: 0 };
    const saved = saveResearchItem(initialTrip, job, ref);
    const changed = {
      ...saved,
      start: "2027-05-16",
      days: updateTripDates(saved, "2027-05-16", saved.end),
    };
    expect(researchVisits(changed, [job])).toHaveLength(1);
    expect(() => saveResearchItem(changed, job, ref)).toThrow(/cambiado/);
    expect(() =>
      saveResearchItem(initialTrip, { ...job, tripId: "other" }, ref),
    ).toThrow();
    expect(() =>
      saveResearchItem(initialTrip, job, { ...ref, index: 9 }),
    ).toThrow();
  });
  it("saves food interests and removes linked scheduling and tasting state with a card", () => {
    const ref = { jobId: job.id, kind: "foods" as const, index: 0 };
    const id = researchItemId(ref);
    const saved = saveResearchItem(initialTrip, job, ref);
    expect(saved.foodInterested).toContain(id);
    const removed = removeResearchItem(
      { ...saved, selected: [id], days: { [id]: saved.start }, tasted: [id] },
      id,
    );
    expect(removed.researchSelections).toEqual([]);
    expect(removed.selected).toEqual([]);
    expect(removed.days).toEqual({});
    expect(removed.tasted).toEqual([]);
    expect(job.result?.foods).toHaveLength(1);
  });
});
