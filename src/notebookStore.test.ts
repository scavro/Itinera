import { describe, expect, it } from "vitest";
import { NotebookStore } from "./notebookStore";
import { ApiError, type Notebook } from "./api";
import { initialTrip } from "./domain";
const notebook = (): Notebook => ({
  trips: [structuredClone(initialTrip)],
  active: initialTrip.id,
  provider: "Gemini",
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
describe("serialized notebook writes", () => {
  it("preserves edits made during a confirmed form write and saves them next", async () => {
    const reply = deferred<{ version: number }>();
    const writes: Parameters<
      ConstructorParameters<typeof NotebookStore>[0]
    >[0][] = [];
    const store = new NotebookStore(async (value) => {
      writes.push(value);
      return writes.length === 1 ? reply.promise : { version: writes.length };
    });
    store.reset(notebook(), 0);
    const saving = store.commit((value) => ({
      ...value,
      trips: value.trips.map((t) => ({ ...t, destination: "Roma" })),
    }));
    await turn();
    expect(store.snapshot.data.trips[0].destination).toBe(
      initialTrip.destination,
    );
    store.change((value) => ({ ...value, provider: "OpenAI" }));
    reply.resolve({ version: 1 });
    await saving;
    expect(writes).toHaveLength(2);
    expect(writes[1].version).toBe(1);
    expect(store.snapshot.data.provider).toBe("OpenAI");
    expect(store.snapshot.data.trips[0].destination).toBe("Roma");
    expect(store.snapshot.dirty).toBe(false);
  });
  it("serializes two concurrent commits against successive versions", async () => {
    const reply = deferred<{ version: number }>();
    const versions: number[] = [];
    const store = new NotebookStore(async (value) => {
      versions.push(value.version);
      return versions.length === 1 ? reply.promise : { version: 2 };
    });
    store.reset(notebook(), 0);
    const first = store.commit((value) => ({ ...value, provider: "OpenAI" }));
    const second = store.commit((value) => ({
      ...value,
      trips: value.trips.map((t) => ({ ...t, notes: "Ópera" })),
    }));
    await turn();
    expect(versions).toEqual([0]);
    reply.resolve({ version: 1 });
    await Promise.all([first, second]);
    expect(versions).toEqual([0, 1]);
    expect(store.snapshot.data.provider).toBe("OpenAI");
    expect(store.snapshot.data.trips[0].notes).toBe("Ópera");
  });
  it("retries an uncertain write with the same ID before sending newer edits", async () => {
    const writes: { mutationId: string; version: number; data: Notebook }[] =
      [];
    const store = new NotebookStore(async (value) => {
      writes.push(value);
      if (writes.length === 1) throw new ApiError(0, "timeout");
      return { version: writes.length - 1 };
    });
    store.reset(notebook(), 0);
    store.change((value) => ({ ...value, provider: "OpenAI" }));
    await expect(store.flush()).rejects.toThrow("timeout");
    store.change((value) => ({ ...value, provider: "Gemini" }));
    await store.flush();
    expect(writes).toHaveLength(3);
    expect(writes[0].mutationId).toBe(writes[1].mutationId);
    expect(writes[2].mutationId).not.toBe(writes[0].mutationId);
    expect(writes[2].version).toBe(1);
    expect(store.snapshot.data.provider).toBe("Gemini");
  });
  it("does not apply a rejected form locally and retries it without appending twice", async () => {
    let calls = 0;
    const store = new NotebookStore(async () => {
      if (++calls === 1) throw new ApiError(503, "unavailable");
      return { version: 1 };
    });
    store.reset(notebook(), 0);
    const add = (value: Notebook) => ({
      ...value,
      trips: [...value.trips, { ...initialTrip, id: "new" }],
    });
    await expect(store.commit(add)).rejects.toThrow("unavailable");
    expect(store.snapshot.data.trips).toHaveLength(1);
    expect(store.snapshot.dirty).toBe(true);
    await store.commit(add);
    expect(calls).toBe(2);
    expect(store.snapshot.data.trips).toHaveLength(2);
  });
  it("does not report a confirmed creation as failed when a subsequent edit cannot save", async () => {
    const reply = deferred<{ version: number }>();
    let calls = 0;
    const store = new NotebookStore(async () => {
      if (++calls === 1) return reply.promise;
      throw new ApiError(503, "later failure");
    });
    store.reset(notebook(), 0);
    const create = store.commit((value) => ({
      ...value,
      trips: [...value.trips, { ...initialTrip, id: "new" }],
    }));
    await turn();
    store.change((value) => ({ ...value, provider: "OpenAI" }));
    reply.resolve({ version: 1 });
    await expect(create).resolves.toBeUndefined();
    expect(store.snapshot.data.trips).toHaveLength(2);
    expect(store.snapshot.state).toBe("error");
    expect(store.snapshot.dirty).toBe(true);
  });
  it("allows correction after a definite form validation rejection", async () => {
    let calls = 0;
    const store = new NotebookStore(async () => {
      if (++calls === 1) throw new ApiError(400, "invalid");
      return { version: 1 };
    });
    store.reset(notebook(), 0);
    await expect(
      store.commit((value) => ({ ...value, provider: "invalid" })),
    ).rejects.toThrow("invalid");
    await store.commit((value) => ({ ...value, provider: "OpenAI" }));
    expect(calls).toBe(2);
    expect(store.snapshot.data.provider).toBe("OpenAI");
  });
  it("does not write while the session is blocked; reload explicitly discards conflict", async () => {
    let calls = 0;
    const store = new NotebookStore(async () => {
      calls++;
      throw new ApiError(409, "conflict");
    });
    store.reset(notebook(), 0);
    store.change((value) => ({ ...value, provider: "OpenAI" }));
    await expect(store.flush()).rejects.toThrow("conflict");
    expect(store.snapshot.data.provider).toBe("OpenAI");
    store.blocked = true;
    await expect(store.flush()).rejects.toThrow("sesión");
    expect(calls).toBe(1);
    store.blocked = false;
    store.reset(notebook(), 7);
    expect(store.snapshot.state).toBe("saved");
    expect(store.snapshot.dirty).toBe(false);
  });
});
