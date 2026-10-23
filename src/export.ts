// 匯出：在離屏 canvas 上以固定倍率重畫一次，輸出解析度不再受螢幕 devicePixelRatio 影響

import type { AppState } from './state';
import { encodeQr } from './qr';
import { customLogoVersion, getLogo } from './logo';
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

// --- 分享 (Web Share API) ---

let prepared: { key: string; file: File } | null = null;

export function canShareFiles(): boolean {
  if (typeof navigator.canShare !== 'function') return false;
  const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' });
  return navigator.canShare({ files: [probe] });
}

/** 預先產生要分享的檔案，讓點擊時能立即呼叫 navigator.share (iOS 要求在使用者手勢內) */
export async function prepareShareFile(s: AppState): Promise<void> {
  const key = JSON.stringify(s) + customLogoVersion;
  if (prepared?.key === key) return;
  try {
    const blob = await toPngBlob(renderExport(s));
    prepared = { key, file: new File([blob], `QRGen_${timestamp()}.png`, { type: 'image/png' }) };
  } catch {
    prepared = null;
  }
}

export async function sharePng(s: AppState): Promise<void> {
  const key = JSON.stringify(s) + customLogoVersion;
  if (prepared?.key !== key) await prepareShareFile(s);
  if (!prepared) throw new Error('無法產生圖片');
  // 只傳檔案：同時附文字時，部分 App (例如 LINE) 會只收文字而丟掉圖片
  await navigator.share({ files: [prepared.file] });
}
