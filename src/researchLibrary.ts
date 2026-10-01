import type { Trip, Visit, Category } from "./domain";
import {
  researchItemId,
  researchFingerprint,
  type ResearchJob,
  type ResearchSelection,
} from "./research";

export function saveResearchItem(
  trip: Trip,
  job: ResearchJob,
  ref: ResearchSelection,
): Trip {
  if (
    job.id !== ref.jobId ||
    job.tripId !== trip.id ||
    job.status !== "done" ||
    !job.result?.[ref.kind][ref.index]
  )
    throw new Error("La propuesta no está disponible para este viaje.");
  if (job.fingerprint !== researchFingerprint(trip))
    throw new Error(
      "El viaje ha cambiado. Investiga sus nuevos detalles antes de guardar propuestas.",
    );
  const refs = trip.researchSelections ?? [];
  const id = researchItemId(ref);
  if (refs.some((r) => researchItemId(r) === id)) return trip;
  if (
    refs.length >= 30 ||
    new Set([...refs.map((r) => r.jobId), ref.jobId]).size > 5
  )
    throw new Error(
      "Puedes guardar hasta 30 propuestas de 5 investigaciones por viaje. Retira alguna ficha antes de guardar más.",
    );
  return {
    ...trip,
    researchSelections: [...refs, ref],
    ...(ref.kind === "foods"
      ? { foodInterested: [...new Set([...trip.foodInterested, id])] }
      : { interested: [...new Set([...trip.interested, id])] }),
  };
}
export function removeResearchItem(trip: Trip, id: string): Trip {
  const days = { ...trip.days };
  delete days[id];
  return {
    ...trip,
    researchSelections: trip.researchSelections?.filter(
      (r) => researchItemId(r) !== id,
    ),
    selected: trip.selected.filter((x) => x !== id),
    interested: trip.interested.filter((x) => x !== id),
    foodInterested: trip.foodInterested.filter((x) => x !== id),
    tasted: trip.tasted.filter((x) => x !== id),
    days,
  };
}
export function resolvedResearch(trip: Trip | undefined, jobs: ResearchJob[]) {
  return (trip?.researchSelections ?? []).flatMap((ref) => {
    const job = jobs.find(
      (j) => j.id === ref.jobId && j.tripId === trip?.id && j.status === "done",
    );
    const item = job?.result?.[ref.kind][ref.index];
    return job && item ? [{ id: researchItemId(ref), ref, job, item }] : [];
  });
}
export function researchVisits(
  trip: Trip | undefined,
  jobs: ResearchJob[],
): Visit[] {
  return resolvedResearch(trip, jobs)
    .filter((x) => x.ref.kind !== "foods")
    .map(({ id, item, job }) => {
      const category: Category = item.category.startsWith("Museo")
        ? "Museos"
        : item.category === "Patrimonio romano"
          ? "Patrimonio romano"
          : item.category === "Ópera"
            ? "Ópera"
            : item.category === "Emblemático"
              ? "Emblemáticos"
              : "Agenda cultural";
      return {
        id,
        title: item.title,
        town: item.area,
        category,
        description: item.description,
        duration: "Duración por comprobar",
        art:
          category === "Patrimonio romano"
            ? "roman"
            : category === "Ópera"
              ? "opera"
              : category === "Museos"
                ? "museum"
                : "coast",
        priority: item.category,
        source:
          job.sources.find((s) => item.sourceIds.includes(s.id))?.url ?? "",
        research: { job, item },
      };
    });
}
