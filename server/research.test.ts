import { describe, expect, it } from "vitest";
import { publicSourceUrl, validateProposal } from "./research-tools";
import { researchFingerprint, type Source } from "../src/research";
import { initialTrip } from "../src/domain";
const source: Source = {
  id: "s1",
  title: "Prueba",
  url: "https://museum.org/history",
  text: "Historia de la colección",
  read: "page",
  topic: "cultura",
  consultedAt: "2026-09-30T12:00:00Z",
};
const proposal = {
  summary: "Una propuesta",
  visits: [
    {
      title: "Museo",
      area: "Región",
      category: "Museo de historia",
      description: "Historia",
      sourceIds: ["s1"],
      quote: "Historia de la colección",
      quoteSourceId: "s1",
    },
  ],
  agendas: [],
  foods: [],
  pending: [],
};
describe("Evidence boundaries", () => {
  it("rejects private, credentialed and unsafe source URLs", () => {
    for (const url of [
      "http://museum.org",
      "https://127.0.0.1",
      "https://0x7f.1",
      "https://2130706433",
      "https://[::1]",
      "https://10.0.0.1",
      "https://museum.local",
      "https://user:pass@museum.org",
      "https://museum.org:8787",
      "javascript:alert(1)",
    ])
      expect(publicSourceUrl(url)).toBeNull();
    expect(publicSourceUrl("https://museum.org/page#section")).toBe(
      "https://museum.org/page",
    );
  });
  it("rejects unknown sources rather than accepting a model citation", () => {
    expect(() =>
      validateProposal(
        {
          ...proposal,
          visits: [{ ...proposal.visits[0], sourceIds: ["invented"] }],
        },
        [source],
      ),
    ).toThrow(/referencia/);
  });
  it("requires the quoted text and its source to agree", () => {
    expect(validateProposal(proposal, [source]).visits[0].quote).toBe(
      source.text,
    );
    expect(() =>
      validateProposal(
        {
          ...proposal,
          visits: [{ ...proposal.visits[0], quote: "Entradas disponibles" }],
        },
        [source],
      ),
    ).toThrow(/cita/);
    expect(() =>
      validateProposal(
        {
          ...proposal,
          visits: [{ ...proposal.visits[0], quoteSourceId: "other" }],
        },
        [source],
      ),
    ).toThrow();
  });
  it("invalidates research for changed travel criteria but preserves notebook selections", () => {
    expect(researchFingerprint(initialTrip)).not.toBe(
      researchFingerprint({ ...initialTrip, start: "2027-05-16" }),
    );
    const changedSelections = { ...initialTrip, selected: [] };
    expect(researchFingerprint(initialTrip)).toBe(
      researchFingerprint(changedSelections),
    );
  });
});
