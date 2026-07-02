import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const toPngMock = vi.fn();
vi.mock('html-to-image', () => ({
  toPng: (...args) => toPngMock(...args),
}));

const downloadDataUrlMock = vi.fn();
vi.mock('./download.js', () => ({
  downloadDataUrl: (...args) => downloadDataUrlMock(...args),
}));

describe('imageExport', () => {
  beforeEach(() => {
    toPngMock.mockReset();
    downloadDataUrlMock.mockClear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('no-ops without calling toPng or downloading when the target node is missing', async () => {
    const { exportNodeToPng } = await import('./imageExport.js');
    await exportNodeToPng('does-not-exist', 'out.png');

    expect(toPngMock).not.toHaveBeenCalled();
    expect(downloadDataUrlMock).not.toHaveBeenCalled();
  });

  test('calls toPng with the node and downloads the resulting data URL when the node exists', async () => {
    const node = document.createElement('div');
    node.id = 'capture-root';
    document.body.appendChild(node);
    toPngMock.mockResolvedValue('data:image/png;base64,AAAA');

    const { exportNodeToPng } = await import('./imageExport.js');
    await exportNodeToPng('capture-root', 'out.png');

    expect(toPngMock).toHaveBeenCalledWith(node, { backgroundColor: '#0b1020', pixelRatio: 2 });
    expect(downloadDataUrlMock).toHaveBeenCalledWith('data:image/png;base64,AAAA', 'out.png');
  });

  test('logs an error and does not throw when toPng rejects', async () => {
    const node = document.createElement('div');
    node.id = 'capture-root-2';
    document.body.appendChild(node);
    toPngMock.mockRejectedValue(new Error('rasterize failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { exportNodeToPng } = await import('./imageExport.js');
    await expect(exportNodeToPng('capture-root-2', 'out.png')).resolves.not.toThrow();

    expect(downloadDataUrlMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
