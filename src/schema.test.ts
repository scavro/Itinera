import { describe, expect, it } from "vitest";
import { notebookResponseSchema, sessionResponseSchema } from "./schema";
import {
  parseResearchResponse,
  assertResearchProgress,
} from "./researchSchema";
import { initialTrip } from "./domain";
import type { ResearchJob } from "./research";
const job: ResearchJob = {
  id: "94bf8d20-95d6-435a-95da-062a6d1e00ba",
  tripId: "puglia-demo",
  fingerprint: "{}",
  provider: "Gemini",
  model: "fixture",
  status: "ready",
  stage: 0,
  leaseUntil: 0,
  error: "",
  createdAt: 1,
  sources: [],
  result: null,
  warnings: [],
};
describe("received data boundaries", () => {
  it("rejects malformed notebooks and sessions before they reach the view", () => {
    const response = {
      data: {
        trips: [initialTrip],
        active: initialTrip.id,
        provider: "Gemini",
      },
      version: 0,
    };
    expect(notebookResponseSchema.safeParse(response).success).toBe(true);
    expect(
      notebookResponseSchema.safeParse({
        ...response,
        data: {
          ...response.data,
          trips: [{ ...initialTrip, days: undefined }],
        },
      }).success,
    ).toBe(false);
    expect(
      sessionResponseSchema.safeParse({
        username: "owner",
        expiresAt: "not-a-date",
      }).success,
    ).toBe(false);
  });
  it("rejects invalid source URLs and consultation dates", () => {
    const source = {
      id: "s1",
      title: "Museum",
      url: "broken",
      text: "text",
      topic: "cultura",
      read: "page",
      consultedAt: "2026-09-30T12:00:00Z",
    };
    expect(() =>
      parseResearchResponse({ job: { ...job, sources: [source] } }),
    ).toThrow(/formato/);
    expect(() =>
      parseResearchResponse({
        job: {
          ...job,
          sources: [
            { ...source, url: "https://museum.org", consultedAt: "broken" },
          ],
        },
      }),
    ).toThrow(/formato/);
    expect(parseResearchResponse({ job }).job).toEqual(job);
  });
  it("stops unchanged, mismatched and excessive research steps", () => {
    expect(() => assertResearchProgress(job, job, 1)).toThrow(/avanzado/);
    expect(() =>
      assertResearchProgress(
        job,
        { ...job, id: crypto.randomUUID(), stage: 1 },
        1,
      ),
    ).toThrow();
    expect(() =>
      assertResearchProgress(job, { ...job, stage: 1 }, 6),
    ).toThrow();
    expect(() =>
      assertResearchProgress(job, { ...job, stage: 1 }, 1),
    ).not.toThrow();
    expect(() =>
      assertResearchProgress(job, { ...job, status: "running" }, 1),
    ).not.toThrow();
  });
});
