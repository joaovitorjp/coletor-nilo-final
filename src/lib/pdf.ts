import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfRow = { barcode: string; description?: string | null; quantity: number };

export function downloadColetaPdf(opts: {
  filename: string;
  number: number;
  storeCode: string;
  storeName: string;
  date?: string | null;
  rows: PdfRow[];
}) {
  const { filename, number, storeCode, storeName, date, rows } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(`Coleta N° ${String(number).padStart(3, "0")}`, 40, 45);
  doc.setFontSize(10);
  doc.text(`LOJA ${storeCode} — ${storeName}`, 40, 63);
  doc.text(new Date(date ?? Date.now()).toLocaleString("pt-BR"), 40, 78);

  const total = rows.reduce((s, r) => s + Number(r.quantity), 0);

  autoTable(doc, {
    startY: 95,
    head: [["Código", "Descrição", "Quantidade"]],
    body: rows.map((r) => [r.barcode, r.description ?? "—", String(r.quantity)]),
    foot: [["", "Total", String(total)]],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 110 }, 2: { cellWidth: 80, halign: "right" } },
  });

  doc.save(filename);
}
