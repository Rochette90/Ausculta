export function parseCsv(text: string): string[][] {
  const delimiter = text.split(/\r?\n/, 1)[0]?.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === delimiter) { row.push(field.trim()); field = ""; }
    else if (character === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
    else if (character !== "\r") field += character;
  }
  if (quoted) throw new Error("Guillemet CSV non fermé");
  if (field.length > 0 || row.length > 0) { row.push(field.trim()); rows.push(row); }
  return rows.filter((values) => values.some(Boolean));
}

export function csvRecords(text: string): Array<Record<string, string>> {
  const [headers, ...rows] = parseCsv(text);
  if (!headers) return [];
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return rows.map((values) => Object.fromEntries(normalized.map((header, index) => [header, values[index] ?? ""])));
}
