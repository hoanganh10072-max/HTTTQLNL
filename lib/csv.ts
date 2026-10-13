export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = typeof value === "string" && /^[\s]*[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
