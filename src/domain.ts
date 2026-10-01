import type { ResearchJob, ProposalItem, ResearchSelection } from "./research";
export type Page =
  | "viajes"
  | "preparar"
  | "comparar"
  | "itinerario"
  | "cultura"
  | "sabores"
  | "ajustes";
export type Category =
  "Museos" | "Patrimonio romano" | "Ópera" | "Emblemáticos" | "Agenda cultural";
export type Trip = {
  id: string;
  destination: string;
  origin: string;
  start: string;
  end: string;
  travelers: number;
  budgetPerPerson: number;
  pace: string;
  notes: string;
  selected: string[];
  interested: string[];
  tasted: string[];
  foodInterested: string[];
  checked: string[];
  days: Record<string, string>;
  demo: boolean;
  researchSelections?: ResearchSelection[];
};
export type Visit = {
  id: string;
  title: string;
  town: string;
  category: Category;
  description: string;
  duration: string;
  art: "museum" | "roman" | "opera" | "coast";
  priority: string;
  source: string;
  research?: { job: ResearchJob; item: ProposalItem };
};
export const visits: Visit[] = [
  {
    id: "marta",
    title: "MArTA · Museo Arqueológico",
    town: "Taranto",
    category: "Museos",
    description:
      "Una parada para explorar la historia antigua del sur de Italia. Colecciones, salas abiertas y entradas pendientes de consulta.",
    duration: "2–3 h orientativas",
    art: "museum",
    priority: "Historia y arqueología",
    source: "https://museotaranto.cultura.gov.it/",
  },
  {
    id: "egnazia",
    title: "Parque arqueológico de Egnazia",
    town: "Fasano",
    category: "Patrimonio romano",
    description:
      "El pasado romano junto al Adriático. Recorrido de ejemplo por el yacimiento; acceso, zonas visitables y horarios por comprobar.",
    duration: "2 h orientativas",
    art: "roman",
    priority: "Tu interés por Roma",
    source: "https://musei.puglia.beniculturali.it/",
  },
  {
    id: "petruzzelli",
    title: "Una noche en el Petruzzelli",
    town: "Bari",
    category: "Ópera",
    description:
      "Reservamos un espacio para revisar su temporada. Todavía no se ha consultado si hay ópera durante las fechas del viaje.",
    duration: "Según programación",
    art: "opera",
    priority: "Agenda cultural pendiente",
    source: "https://www.fondazionepetruzzelli.it/",
  },
  {
    id: "polignano",
    title: "Un paseo por Polignano",
    town: "Polignano a Mare",
    category: "Emblemáticos",
    description:
      "Un momento sin prisas para conocer la costa. Propuesta ilustrativa que puedes combinar con las visitas culturales.",
    duration: "1–2 h orientativas",
    art: "coast",
    priority: "Un lugar emblemático",
    source: "https://www.viaggiareinpuglia.it/",
  },
  {
    id: "pinacoteca",
    title: "Pinacoteca de Bari",
    town: "Bari",
    category: "Museos",
    description:
      "El arte regional tiene su lugar en el viaje. Colecciones, exposiciones temporales y condiciones de visita aún sin consultar.",
    duration: "1–2 h orientativas",
    art: "museum",
    priority: "Tu interés por el arte",
    source: "https://www.pinacotecabari.it/",
  },
];
export const foods = [
  {
    id: "orecchiette",
    name: "Orecchiette",
    area: "Puglia",
    type: "Pasta",
    description:
      "Pequeñas “orejas” de pasta. Una preparación regional conocida las acompaña con cime di rapa.",
    ingredients: "Sémola de trigo, agua; acompañamiento variable.",
    symbol: "pasta",
  },
  {
    id: "focaccia",
    name: "Focaccia barese",
    area: "Bari · Puglia",
    type: "Pan",
    description:
      "Focaccia de miga esponjosa, con tomate y aceitunas en una de sus versiones habituales.",
    ingredients: "Harina de trigo, aceite de oliva, tomate y aceitunas.",
    symbol: "bread",
  },
  {
    id: "pasticciotto",
    name: "Pasticciotto",
    area: "Salento · Puglia",
    type: "Dulce",
    description:
      "Masa quebrada con un corazón de crema. Un pequeño descubrimiento para la pausa de la tarde.",
    ingredients: "Harina, huevos, leche y azúcar; variantes locales.",
    symbol: "sweet",
  },
] as const;
export const initialTrip: Trip = {
  id: "puglia-demo",
  destination: "Puglia, Italia",
  origin: "Madrid",
  start: "2027-05-15",
  end: "2027-05-22",
  travelers: 2,
  budgetPerPerson: 200000,
  pace: "Sin prisas",
  notes: "Museos, patrimonio romano y tiempo para dejarnos sorprender.",
  selected: ["marta", "egnazia", "polignano"],
  interested: ["petruzzelli"],
  tasted: [],
  foodInterested: [],
  checked: [],
  days: { marta: "2027-05-17", egnazia: "2027-05-18", polignano: "2027-05-16" },
  demo: true,
};
export const money = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
export const dateLabel = (
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) =>
  new Intl.DateTimeFormat("es-ES", options).format(new Date(`${iso}T12:00:00`));
export function dateRange(start: string, end: string) {
  if (!validDate(start) || !validDate(end) || end < start) return [];
  const days: string[] = [];
  for (
    let date = new Date(`${start}T12:00:00Z`);
    date <= new Date(`${end}T12:00:00Z`) && days.length < 61;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export type Draft = {
  destination: string;
  origin: string;
  start: string;
  end: string;
  travelers: string;
  budget: string;
  pace: string;
  notes: string;
};
export function validateTrip(d: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.destination.trim())
    errors.destination = "Escribe el destino que quieres explorar.";
  if (!d.origin.trim()) errors.origin = "Indica desde dónde sales.";
  if (!validDate(d.start)) errors.start = "Elige una fecha de salida válida.";
  if (!validDate(d.end) || d.end <= d.start)
    errors.end = "La vuelta debe ser posterior a la salida.";
  else if ((Date.parse(d.end) - Date.parse(d.start)) / 86400000 > 60)
    errors.end = "Para esta demo, elige un viaje de hasta 60 noches.";
  if (
    !/^\d+$/.test(d.travelers) ||
    Number(d.travelers) < 1 ||
    Number(d.travelers) > 12
  )
    errors.travelers = "Indica entre 1 y 12 viajeros.";
  const n = Number(d.budget.replace(",", "."));
  if (
    !/^\d+(?:[.,]\d{1,2})?$/.test(d.budget) ||
    !Number.isFinite(n) ||
    n <= 0 ||
    n > 1000000
  )
    errors.budget = "Indica un importe entre 0,01 y 1.000.000 €.";
  return errors;
}
export function updateTripDates(trip: Trip, start: string, end: string) {
  return Object.fromEntries(
    Object.entries(trip.days).map(([id, date]) => [
      id,
      date < start || date > end ? start : date,
    ]),
  );
}
export function budgetAllocation(total: number) {
  const amounts = [
    Math.round(total * 0.25),
    Math.round(total * 0.4),
    Math.round(total * 0.2),
    Math.round(total * 0.1),
  ];
  return [...amounts, total - amounts.reduce((a, b) => a + b, 0)];
}
export function groupBudget(trip: Pick<Trip, "budgetPerPerson" | "travelers">) {
  return trip.budgetPerPerson * trip.travelers;
}
export const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
