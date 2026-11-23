import type { PointReport } from "./model";

// Spreadsheet programs interpret these prefixes as formulas, including after whitespace.
export function csvCell(value: string | number | boolean) {
  let text = String(value);
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function pointReportCsv(rows: PointReport[], from: string, to: string, includeTests: boolean) {
  const header = ["Punto", "Activo", "Pedidos completados", "Comision Bs", "Desde", "Hasta", "Incluye pruebas"];
  return "\uFEFF" + [header, ...rows.map((row) => [row.name, row.active, row.completedOrders, (row.commissionCents / 100).toFixed(2), from, to, includeTests])]
    .map((row) => row.map(csvCell).join(",")).join("\r\n");
}
