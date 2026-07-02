import { beforeEach, describe, expect, test, vi } from 'vitest';

const fakeBuffer = new Uint8Array([1, 2, 3]).buffer;

class FakeWorksheet {
  constructor(name) {
    this.name = name;
    this.rows = [];
    this.columns = [{ width: undefined }, { width: undefined }];
  }

  addRow(row) {
    this.rows.push(row);
    return { font: null };
  }
}

class FakeWorkbook {
  constructor() {
    this.worksheets = [];
    this.xlsx = { writeBuffer: vi.fn().mockResolvedValue(fakeBuffer) };
  }

  addWorksheet(name) {
    const ws = new FakeWorksheet(name);
    this.worksheets.push(ws);
    return ws;
  }
}

vi.mock('exceljs', () => ({
  default: { Workbook: FakeWorkbook },
}));

const downloadBlobMock = vi.fn();
vi.mock('./download.js', () => ({
  downloadBlob: (...args) => downloadBlobMock(...args),
}));

describe('excelExport', () => {
  const model = {
    title: 'Test',
    summaryRows: [{ label: 'Total', value: '$100' }],
    breakdownRows: [{ category: 'Kitting & Site', perSample: '$10.00', totalStudy: '$100' }],
    assumptionRows: [{ label: 'Region', value: 'United States (Baseline)' }],
  };

  beforeEach(() => {
    downloadBlobMock.mockClear();
  });

  test('buildWorkbook creates Summary, Breakdown, and Assumptions sheets with rows', async () => {
    const { buildWorkbook } = await import('./excelExport.js');
    const workbook = buildWorkbook(model);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).toEqual(['Summary', 'Breakdown', 'Assumptions']);

    const summarySheet = workbook.worksheets.find((ws) => ws.name === 'Summary');
    // header row + 1 data row
    expect(summarySheet.rows).toHaveLength(2);
    expect(summarySheet.rows[0]).toEqual(['Metric', 'Value']);
    expect(summarySheet.rows[1]).toEqual(['Total', '$100']);
  });

  test('exportToExcel calls workbook.xlsx.writeBuffer and the download helper', async () => {
    const { exportToExcel } = await import('./excelExport.js');
    await exportToExcel(model, 'test.xlsx');

    expect(downloadBlobMock).toHaveBeenCalledTimes(1);
    const [blobArg, filenameArg] = downloadBlobMock.mock.calls[0];
    expect(filenameArg).toBe('test.xlsx');
    expect(blobArg).toBeInstanceOf(Blob);
  });
});
