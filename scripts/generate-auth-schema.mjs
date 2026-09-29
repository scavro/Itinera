import { getSchema } from "better-auth/db";
import { authOptions } from "../server/auth.ts";
import { mkdirSync, writeFileSync } from "node:fs";
const q = (value) => `"${value.replaceAll('"', '""')}"`;
const schema = getSchema(authOptions);
let sql =
  "-- Generated from the pinned Better Auth schema. Apply once through D1 migrations.\n";
for (const [table, { fields }] of Object.entries(schema)) {
  const columns = ['"id" TEXT PRIMARY KEY NOT NULL'];
  for (const [name, field] of Object.entries(fields)) {
    let column = `${q(name)} ${["number", "boolean", "date"].includes(field.type) ? "INTEGER" : "TEXT"}`;
    if (field.required) column += " NOT NULL";
    if (field.unique) column += " UNIQUE";
    if (field.references)
      column += ` REFERENCES ${q(field.references.model)} (${q(field.references.field)}) ON DELETE ${field.references.onDelete ?? "CASCADE"}`;
    columns.push(column);
  }
  sql += `CREATE TABLE ${q(table)} (\n  ${columns.join(",\n  ")}\n);\n`;
  for (const [name, field] of Object.entries(fields)) {
    if (field.index)
      sql += `CREATE INDEX ${q(`${table}_${name}`)} ON ${q(table)} (${q(name)});\n`;
  }
}
sql += `CREATE TRIGGER one_owner BEFORE INSERT ON "user"
WHEN NEW.id != 'owner'
BEGIN SELECT RAISE(ABORT, 'Single-owner application'); END;
CREATE TABLE notebook (
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  mutation_id TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`;
mkdirSync("migrations", { recursive: true });
writeFileSync("migrations/0001_private_notebook.sql", sql);
