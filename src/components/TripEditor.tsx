import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Dialog, Field, SelectField } from "./ui";
import {
  type Trip,
  type Draft,
  validateTrip,
  updateTripDates,
  money,
} from "../domain";
export function TripEditor({
  trip,
  onClose,
  onSave,
}: {
  trip?: Trip;
  onClose: () => void;
  onSave: (trip: Trip) => Promise<void>;
}) {
  const initial: Draft = {
    destination: trip?.destination ?? "",
    origin: trip?.origin ?? "Madrid",
    start: trip?.start ?? "",
    end: trip?.end ?? "",
    travelers: String(trip?.travelers ?? 2),
    budget: trip ? String(trip.budgetPerPerson / 100) : "",
    pace: trip?.pace ?? "Sin prisas",
    notes: trip?.notes ?? "",
  };
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const validation = validateTrip(draft);
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  const close = () => {
    if (!busy) {
      if (dirty) setDiscard(true);
      else onClose();
    }
  };
  const set = (key: keyof Draft, value: string) =>
    setDraft({ ...draft, [key]: value });
  return (
    <Dialog
      title={
        discard
          ? "¿Descartar los cambios?"
          : trip
            ? "Afinar tu viaje"
            : "¿Dónde empieza tu próximo viaje?"
      }
      onClose={discard ? () => setDiscard(false) : close}
    >
      {discard ? (
        <>
          <p>
            Los cambios de este formulario todavía no se han aplicado al
            borrador.
          </p>
          <div className="dialog-actions">
            <Button onClick={() => setDiscard(false)} autoFocus>
              Seguir editando
            </Button>
            <Button variant="danger" onClick={onClose}>
              Descartar cambios
            </Button>
          </div>
        </>
      ) : (
        <form
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const e = validateTrip(draft);
            setErrors(e);
            if (Object.keys(e).length) {
              document.getElementById(Object.keys(e)[0])?.focus();
              return;
            }
            setBusy(true);
            setSaveError("");
            try {
              await onSave({
                id: trip?.id ?? crypto.randomUUID(),
                destination: draft.destination.trim(),
                origin: draft.origin.trim(),
                start: draft.start,
                end: draft.end,
                pace: draft.pace,
                notes: draft.notes,
                budgetPerPerson: Math.round(
                  Number(draft.budget.replace(",", ".")) * 100,
                ),
                travelers: Number(draft.travelers),
                selected: trip?.selected ?? [],
                interested: trip?.interested ?? [],
                tasted: trip?.tasted ?? [],
                foodInterested: trip?.foodInterested ?? [],
                checked: trip?.checked ?? [],
                days: trip ? updateTripDates(trip, draft.start, draft.end) : {},
                demo: trip?.demo ?? false,
                ...(trip?.researchSelections
                  ? { researchSelections: trip.researchSelections }
                  : {}),
              });
            } catch (e) {
              setSaveError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="muted">
            Dale forma a la idea. Podrás ajustar cada detalle después.
          </p>
          <fieldset className="form-grid editor-fields" disabled={busy}>
            <Field
              id="destination"
              label="Destino o región"
              placeholder="Por ejemplo, Puglia, Italia"
              value={draft.destination}
              error={errors.destination}
              onChange={(e) => set("destination", e.target.value)}
              autoFocus
              maxLength={100}
            />
            <Field
              id="origin"
              label="Ciudad de salida"
              value={draft.origin}
              error={errors.origin}
              onChange={(e) => set("origin", e.target.value)}
              maxLength={100}
            />
            <Field
              id="start"
              label="Ida"
              type="date"
              value={draft.start}
              error={errors.start}
              onChange={(e) => set("start", e.target.value)}
              onInput={(e) => set("start", e.currentTarget.value)}
            />
            <Field
              id="end"
              label="Vuelta"
              type="date"
              value={draft.end}
              error={errors.end}
              onChange={(e) => set("end", e.target.value)}
              onInput={(e) => set("end", e.currentTarget.value)}
            />
            <Field
              id="travelers"
              label="Viajeros"
              type="number"
              min="1"
              max="12"
              value={draft.travelers}
              error={errors.travelers}
              onChange={(e) => set("travelers", e.target.value)}
            />
            <div className="budget-field">
              <Field
                id="budget"
                label="Presupuesto total por persona (€)"
                inputMode="decimal"
                placeholder="2000"
                value={draft.budget}
                error={errors.budget}
                onChange={(e) => set("budget", e.target.value)}
              />
              {draft.budget && !validation.budget && !validation.travelers && (
                <p className="field-summary">
                  Total para {draft.travelers} viajeros:{" "}
                  {money(
                    Math.round(Number(draft.budget.replace(",", ".")) * 100) *
                      Number(draft.travelers),
                  )}
                </p>
              )}
            </div>
            <SelectField
              id="pace"
              label="Ritmo del viaje"
              value={draft.pace}
              onChange={(e) => set("pace", e.target.value)}
            >
              <option>Sin prisas</option>
              <option>Equilibrado</option>
              <option>Aprovechar cada día</option>
            </SelectField>
            <div className="field">
              <label htmlFor="notes">Algo que no quieres perderte</label>
              <textarea
                className="resize-none"
                id="notes"
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                maxLength={1500}
                rows={3}
                placeholder="Una exposición, un lugar, una idea…"
              />
            </div>
          </fieldset>
          <div className="notice compact" role={saveError ? "alert" : "status"}>
            {saveError || "El viaje se guardará en tu cuaderno del servidor."}
          </div>
          <div className="dialog-actions">
            <Button type="button" onClick={close} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={busy}
              aria-busy={busy}
            >
              {busy
                ? "Guardando…"
                : trip
                  ? "Aplicar cambios"
                  : "Crear borrador"}
              <ArrowRight size={17} />
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
