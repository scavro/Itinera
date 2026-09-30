// Deliberately narrow until the test harness supports additional statement kinds.
// A future migration must never appear to pass after being silently skipped.
export function migrationStatements(sql) {
  const clean = sql.replace(/--[^\n]*/g, "");
  const expression =
    /CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|(?:UNIQUE )?INDEX)[\s\S]*?;/g;
  const statements = [...clean.matchAll(expression)];
  let offset = 0;
  for (const statement of statements) {
    if (clean.slice(offset, statement.index).trim())
      throw new Error(
        "Unsupported migration statement: update the test harness before proceeding",
      );
    offset = statement.index + statement[0].length;
  }
  if (clean.slice(offset).trim() || !statements.length)
    throw new Error(
      "Unsupported or empty migration: update the test harness before proceeding",
    );
  return statements.map((statement) => statement[0]);
}
