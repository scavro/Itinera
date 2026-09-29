import { describe, it, expect } from "vitest";
import {
  validateTrip,
  dateRange,
  budgetAllocation,
  groupBudget,
  updateTripDates,
  initialTrip,
  type Draft,
} from "./domain";
const draft: Draft = {
  destination: "Roma",
  origin: "Madrid",
  start: "2027-05-15",
  end: "2027-05-22",
  travelers: "2",
  budget: "2000",
  pace: "Sin prisas",
  notes: "",
};
describe("Criterios de viaje", () => {
  it("rechaza fechas imposibles, vuelta anterior y rango excesivo", () => {
    expect(validateTrip({ ...draft, start: "2027-02-30" }).start).toBeTruthy();
    expect(validateTrip({ ...draft, end: "2027-05-14" }).end).toBeTruthy();
    expect(validateTrip({ ...draft, end: "2028-05-22" }).end).toBeTruthy();
  });
  it("acepta coma decimal pero rechaza cantidades ambiguas y fracciones de viajero", () => {
    expect(validateTrip({ ...draft, budget: "1234,56" })).toEqual({});
    for (const budget of ["-2", "0", "1e4", "NaN", "3.141", ""])
      expect(validateTrip({ ...draft, budget }).budget).toBeTruthy();
    expect(validateTrip({ ...draft, travelers: "1.5" }).travelers).toBeTruthy();
  });
  it("no desplaza días por zona horaria o cambio de hora", () => {
    expect(dateRange("2027-03-27", "2027-03-29")).toEqual([
      "2027-03-27",
      "2027-03-28",
      "2027-03-29",
    ]);
  });
  it("reubica selecciones fuera de las nuevas fechas", () => {
    expect(updateTripDates(initialTrip, "2027-06-01", "2027-06-08").marta).toBe(
      "2027-06-01",
    );
  });
  it("mantiene el total exacto del reparto sin perder céntimos", () => {
    for (const budget of [1, 199999, 200000, 257833])
      expect(budgetAllocation(budget).reduce((a, b) => a + b, 0)).toBe(budget);
  });
  it("calcula el total de viajeros a partir del presupuesto por persona", () => {
    expect(groupBudget(initialTrip)).toBe(400000);
    expect(groupBudget({ budgetPerPerson: 123456, travelers: 3 })).toBe(370368);
  });
});
