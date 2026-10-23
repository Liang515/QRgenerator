// 匯出：在離屏 canvas 上以固定倍率重畫一次，輸出解析度不再受螢幕 devicePixelRatio 影響

import type { AppState } from './state';
import { encodeQr } from './qr';
import { getLogo } from './logo';
import { drawPoster } from './renderer';

/** 匯出倍率：QR 280 時輸出寬度為 (280 + 120) × 3 = 1200px，足以印刷 */
export const EXPORT_SCALE = 3;

function renderExport(s: AppState): HTMLCanvasElement {
  const qr = encodeQr(s.url);
  if (!qr.ok) throw new Error(qr.reason);
  const canvas = document.createElement('canvas');
  drawPoster(canvas, s, qr, getLogo(s.logoMode), EXPORT_SCALE);
  return canvas;
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('無法將畫布轉換為 PNG'))), 'image/png');
  });
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** 下載 PNG，回傳輸出的像素尺寸 */
export async function downloadPng(s: AppState): Promise<{ width: number; height: number }> {
  const canvas = renderExport(s);
  const blob = await toPngBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `QRGen_${timestamp()}.png`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return { width: canvas.width, height: canvas.height };
}

/**
 * 複製到剪貼簿。必須在點擊事件中「同步」呼叫 clipboard.write，
 * 並把 Blob 以 Promise 形式交給 ClipboardItem，Safari 才會保留使用者手勢授權。
 */
export function copyPng(s: AppState): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    return Promise.reject(new Error('unsupported'));
  }
  const blob = Promise.resolve().then(() => toPngBlob(renderExport(s)));
  return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
