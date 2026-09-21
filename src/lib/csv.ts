// Puntkomma als scheidingsteken: opent in Nederlandstalige Excel direct
// correct (komma is daar decimaalteken, dus Excel-NL verwacht ";" als CSV-
// lijstscheider), zonder tussenkomst van de import-wizard.
function escapeCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const body = rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");
  // UTF-8 BOM zodat Excel accenten (é, ë) goed toont.
  return "﻿" + body;
}
