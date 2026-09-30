-- Research is separate from the editable notebook: stale clients cannot overwrite evidence.
CREATE TABLE research_jobs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ready','running','done','error','cancelled')),
  stage INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX research_by_trip ON research_jobs(owner_id,trip_id,created_at DESC);
CREATE UNIQUE INDEX research_one_active ON research_jobs(owner_id) WHERE status IN ('ready','running');
CREATE TABLE research_usage (
  period TEXT NOT NULL,
  service TEXT NOT NULL,
  reserved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(period,service)
);
