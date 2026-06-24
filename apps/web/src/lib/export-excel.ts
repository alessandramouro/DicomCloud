import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T | ((row: T) => string | number | null | undefined);
  width?: number;
}

export function exportToExcel<T extends object>(
  data: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  sheetName = 'Dados',
): void {
  const headers = columns.map((c) => c.header);

  const rows = data.map((row) =>
    columns.map((col) => {
      if (typeof col.key === 'function') return col.key(row) ?? '';
      const val = row[col.key];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toLocaleString('pt-BR');
      return val as string | number;
    }),
  );

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }));

  // Header style (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = { font: { bold: true }, fill: { fgColor: { rgb: '1E293B' } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const ts = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}
