import { toPng } from 'html-to-image';
import { downloadDataUrl } from './download.js';

export async function exportNodeToPng(nodeId, filename) {
  const node = document.getElementById(nodeId);
  if (!node) {
    return;
  }

  try {
    const dataUrl = await toPng(node, { backgroundColor: '#0b1020', pixelRatio: 2 });
    downloadDataUrl(dataUrl, filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to export image', error);
  }
}
