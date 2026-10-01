import { Heart, Check, Trash2 } from "lucide-react";
import type { Trip } from "../domain";
import { toggle } from "../domain";
import type { ResearchJob } from "../research";
import { resolvedResearch, removeResearchItem } from "../researchLibrary";
import { ResearchEvidence } from "./Research";
import { PhotoPending } from "./PhotoPending";
import { Button } from "./ui";
export function ResearchFoods({
  trip,
  jobs,
  tab,
  update,
}: {
  trip: Trip;
  jobs: ResearchJob[];
  tab: string;
  update: (trip: Trip) => void;
}) {
  return (
    <>
      {resolvedResearch(trip, jobs)
        .filter(
          (x) =>
            x.ref.kind === "foods" &&
            (tab === "Todos" ||
              (tab === "Me interesan"
                ? trip.foodInterested.includes(x.id)
                : trip.tasted.includes(x.id))),
        )
        .map(({ id, item, job }) => (
          <article className="food-card" key={id}>
            <PhotoPending kind="food" />
            <div className="visit-content">
              <div className="card-meta">
                <span>{item.category}</span>
                <span>{item.area}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ResearchEvidence job={job} item={item} trip={trip} />
              <div className="food-actions">
                <Button
                  aria-pressed={trip.foodInterested.includes(id)}
                  onClick={() =>
                    update({
                      ...trip,
                      foodInterested: toggle(trip.foodInterested, id),
                    })
                  }
                >
                  <Heart size={15} />
                  {trip.foodInterested.includes(id)
                    ? "Me interesa"
                    : "Me apetece probar"}
                </Button>
                <Button
                  aria-pressed={trip.tasted.includes(id)}
                  onClick={() =>
                    update({ ...trip, tasted: toggle(trip.tasted, id) })
                  }
                >
                  <Check size={16} />
                  {trip.tasted.includes(id) ? "Probado" : "Lo he probado"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => update(removeResearchItem(trip, id))}
                  aria-label={`Retirar ${item.title} de las fichas guardadas`}
                >
                  <Trash2 size={16} />
                  Retirar ficha
                </Button>
              </div>
            </div>
          </article>
        ))}
    </>
  );
}
