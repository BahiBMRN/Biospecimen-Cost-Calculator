import ExcelJS from 'exceljs';
import { downloadBlob } from './download.js';

function addTable(sheet, headers, rows) {
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => {
    column.width = 32;
  });
}

export function buildWorkbook(model) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'B$LCC';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  addTable(summarySheet, ['Metric', 'Value'], model.summaryRows.map((row) => [row.label, row.value]));

  const breakdownSheet = workbook.addWorksheet('Breakdown');
  addTable(
    breakdownSheet,
    ['Category', 'Per Sample', 'Total Study'],
    model.breakdownRows.map((row) => [row.category, row.perSample, row.totalStudy])
  );

  const assumptionsSheet = workbook.addWorksheet('Assumptions');
  addTable(assumptionsSheet, ['Assumption', 'Value'], model.assumptionRows.map((row) => [row.label, row.value]));

  return workbook;
}

export async function exportToExcel(model, filename) {
  const workbook = buildWorkbook(model);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}
