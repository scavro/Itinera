export const providers = ["OpenAI", "Gemini", "Claude", "OpenCode Go"] as const;
export type Provider = (typeof providers)[number];
export type ResearchSelection = {
  jobId: string;
  kind: "visits" | "agendas" | "foods";
  index: number;
};
export function researchItemId(ref: ResearchSelection) {
  return `research-${ref.jobId}-${ref.kind}-${ref.index}`;
}
export const researchStages = [
  "Localizar museos y patrimonio",
  "Revisar agendas culturales",
  "Explorar gastronomía",
  "Leer las fuentes",
  "Preparar la propuesta",
];
export type Source = {
  id: string;
  title: string;
  url: string;
  text: string;
  topic: "cultura" | "agenda" | "gastronomía";
  read: "search" | "page" | "unavailable";
  consultedAt: string;
};
export type ProposalItem = {
  title: string;
  area: string;
  category: string;
  description: string;
  sourceIds: string[];
  quote: string;
  quoteSourceId: string;
};
export type Proposal = {
  summary: string;
  visits: ProposalItem[];
  agendas: ProposalItem[];
  foods: ProposalItem[];
  pending: string[];
};
export type ResearchJob = {
  id: string;
  tripId: string;
  fingerprint: string;
  provider: Provider;
  model: string;
  status: "ready" | "running" | "done" | "error" | "cancelled";
  stage: number;
  leaseUntil: number;
  error: string;
  createdAt: number;
  sources: Source[];
  result: Proposal | null;
  warnings: string[];
};
export type Connections = {
  providers: {
    name: Provider;
    configured: boolean;
    model: string;
    enabled: boolean;
  }[];
  search: { name: string; configured: boolean; used: number; limit: number };
  ai: { used: number; limit: number };
};
export function researchFingerprint(trip: {
  destination: string;
  origin: string;
  start: string;
  end: string;
  travelers: number;
  budgetPerPerson: number;
  pace: string;
  notes: string;
}) {
  return JSON.stringify({
    destination: trip.destination,
    origin: trip.origin,
    start: trip.start,
    end: trip.end,
    travelers: trip.travelers,
    budgetPerPerson: trip.budgetPerPerson,
    pace: trip.pace,
    notes: trip.notes,
  });
}
