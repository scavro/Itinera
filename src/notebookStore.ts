import { ApiError, type Notebook } from "./api";
export type NotebookState =
  "loading" | "saved" | "pending" | "saving" | "error" | "conflict" | "expired";
type Transform = (data: Notebook) => Notebook;
type Write = { data: Notebook; version: number; mutationId: string };
type Pending = {
  data: Notebook;
  payload: string;
  id: string;
  commit: boolean;
  base: Notebook;
  changes: Transform[];
};
const empty: Notebook = { trips: [], active: "", provider: "OpenAI" };
// Serialize autosave and form operations. Retain uncertain writes and their IDs
// until confirmation or explicit reload; replay edits made during a form write.
export class NotebookStore {
  snapshot = {
    data: empty,
    state: "loading" as NotebookState,
    error: "",
    ready: false,
    dirty: false,
  };
  private saved = JSON.stringify(empty);
  private version = 0;
  private pending: Pending | null = null;
  private tail: Promise<void> = Promise.resolve();
  blocked = false;
  notify = () => {};
  expired = () => {};
  constructor(
    private write: (request: Write) => Promise<{ version: number }>,
  ) {}
  private publish(update: Partial<typeof this.snapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.notify();
  }
  reset(data: Notebook, version: number) {
    this.saved = JSON.stringify(data);
    this.version = version;
    this.pending = null;
    this.publish({
      data,
      ready: true,
      dirty: false,
      state: "saved",
      error: "",
    });
  }
  loading() {
    this.publish({ state: "loading", error: "", ready: false });
  }
  fail(error: unknown) {
    const status = error instanceof ApiError ? error.status : 0;
    this.publish({
      error:
        error instanceof Error ? error.message : "No se ha podido guardar.",
      state: status === 409 ? "conflict" : status === 401 ? "expired" : "error",
    });
    if (status === 401) this.expired();
  }
  resume() {
    if (this.snapshot.state === "expired")
      this.publish({
        state: this.snapshot.dirty || this.pending ? "pending" : "saved",
        error: "",
      });
  }
  change(transform: Transform) {
    if (this.blocked || !this.snapshot.ready) return;
    const data = transform(this.snapshot.data);
    if (this.pending?.commit) this.pending.changes.push(transform);
    this.publish({
      data,
      dirty: !!this.pending?.commit || JSON.stringify(data) !== this.saved,
      state: ["error", "conflict", "expired"].includes(this.snapshot.state)
        ? this.snapshot.state
        : "pending",
    });
  }
  private queue(task: () => Promise<void>) {
    const operation = this.tail.then(async () => {
      try {
        if (this.blocked)
          throw new ApiError(401, "Tu sesión ha finalizado. Vuelve a entrar.");
        if (!this.snapshot.ready)
          throw new ApiError(0, "Espera a que se cargue tu cuaderno.");
        await task();
      } catch (e) {
        this.fail(e);
        throw e;
      }
    });
    this.tail = operation.catch(() => {});
    return operation;
  }
  idle() {
    return this.tail;
  }
  private async send() {
    if (this.blocked)
      throw new ApiError(401, "Tu sesión ha finalizado. Vuelve a entrar.");
    const pending = this.pending!;
    this.publish({
      state: "saving",
      error: "",
      dirty: this.snapshot.dirty || pending.commit,
    });
    let result: { version: number };
    try {
      result = await this.write({
        data: pending.data,
        version: this.version,
        mutationId: pending.id,
      });
    } catch (e) {
      // Validation rejection is definite. An edited form may submit a new write;
      // timeouts/5xx/conflicts retain the exact attempt for recovery instead.
      if (
        pending.commit &&
        e instanceof ApiError &&
        [400, 404, 422].includes(e.status)
      ) {
        this.pending = null;
        this.publish({
          dirty: JSON.stringify(this.snapshot.data) !== this.saved,
        });
      }
      throw e;
    }
    this.version = result.version;
    this.saved = pending.payload;
    const data = pending.commit
      ? pending.changes.reduce(
          (value, transform) => transform(value),
          pending.data,
        )
      : this.snapshot.data;
    this.pending = null;
    this.publish({ data, dirty: JSON.stringify(data) !== this.saved });
  }
  private async drain() {
    while (this.pending || this.snapshot.dirty) {
      this.pending ??= {
        data: this.snapshot.data,
        payload: JSON.stringify(this.snapshot.data),
        id: crypto.randomUUID(),
        commit: false,
        base: this.snapshot.data,
        changes: [],
      };
      await this.send();
    }
    this.publish({ state: "saved", error: "" });
  }
  flush() {
    return this.queue(() => this.drain());
  }
  commit(transform: Transform) {
    return this.queue(async () => {
      const retrying =
        this.pending?.commit &&
        JSON.stringify(transform(this.pending.base)) === this.pending.payload;
      await this.drain();
      if (retrying) return;
      const data = transform(this.snapshot.data);
      this.pending = {
        data,
        payload: JSON.stringify(data),
        id: crypto.randomUUID(),
        commit: true,
        base: this.snapshot.data,
        changes: [],
      };
      await this.send();
      // The form is confirmed. A later autosave failure must not make the
      // caller repeat a successful creation/deletion; retain its error/draft.
      try {
        await this.drain();
      } catch (e) {
        this.fail(e);
      }
    });
  }
}
