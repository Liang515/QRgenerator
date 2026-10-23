// 海報繪製：預覽與匯出共用同一套邏輯，只差在 scale (像素倍率)

import type { AppState } from './state';
import type { QrResult } from './qr';
import { wrapText } from './text';

type QrOk = Extract<QrResult, { ok: true }>;
type LogoSource = HTMLImageElement | ImageBitmap;

/** 海報外圍留白 */
const PADDING = 60;
/** QR 四周的安靜區 (quiet zone)，以 module 數計；用 QR 背景色填滿，深色海報上也掃得到 */
const QUIET_MODULES = 2;
const FONT_FAMILY = `'Plus Jakarta Sans', 'Noto Sans TC', sans-serif`;

export function posterFont(fontSize: number): string {
  return `bold ${fontSize}px ${FONT_FAMILY}`;
}

/** 把 QR 矩陣畫成「1 module = 1 px」的小圖，之後以最近鄰放大，邊緣銳利且不會有接縫 */
function rasterizeQr(qr: QrOk, dark: string, light: string): HTMLCanvasElement {
  const n = qr.size + QUIET_MODULES * 2;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  g.fillStyle = light;
  g.fillRect(0, 0, n, n);
  g.fillStyle = dark;
  for (let r = 0; r < qr.size; r++) {
    for (let col = 0; col < qr.size; col++) {
      if (qr.isDark(r, col)) g.fillRect(col + QUIET_MODULES, r + QUIET_MODULES, 1, 1);
    }
  }
  return c;
}

/**
 * 依狀態把海報畫到 canvas 上。canvas 的實際像素 = 邏輯尺寸 × scale。
 * 回傳海報的邏輯尺寸 (CSS px)。
 */
export function drawPoster(
  canvas: HTMLCanvasElement,
  s: AppState,
  qr: QrOk,
  logo: LogoSource | null,
  scale: number,
): { width: number; height: number } {
  const ctx = canvas.getContext('2d')!;

  // 1. 計算描述文字換行 (先量字寬才知道畫布高度)
  ctx.font = posterFont(s.fontSize);
  const lines = s.desc.trim() ? wrapText(ctx, s.desc.trim(), s.qrSize) : [];
  const lineHeight = s.fontSize * 1.4;
  const textHeight = lines.length * lineHeight;

  const width = s.qrSize + PADDING * 2;
  const height = PADDING * 2 + s.qrSize + (lines.length ? s.gap + textHeight : 0);

  // 設定 canvas 尺寸會重設所有狀態 (含 transform)
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // 2. 海報背景
  ctx.fillStyle = s.bgColor;
  ctx.fillRect(0, 0, width, height);

  // 3. QR 本體
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(rasterizeQr(qr, s.qrDark, s.qrLight), PADDING, PADDING, s.qrSize, s.qrSize);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 4. 中心 LOGO
  if (logo) {
    const size = s.qrSize * s.logoScale;
    const x = (width - size) / 2;
    const y = PADDING + (s.qrSize - size) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, Math.min(size / 2, s.logoRadius));
    ctx.clip();
    // 先鋪 QR 背景色，避免透明 LOGO 透出底下的碼點
    ctx.fillStyle = s.qrLight;
    ctx.fill();
    // 以中心為基準放大後裁切，用來去掉圖片本身的白邊；非正方形圖片等比置中 (cover)
    const zoomed = size * s.logoZoom;
    const ratio = logo.width / logo.height;
    const dw = ratio >= 1 ? zoomed * ratio : zoomed;
    const dh = ratio >= 1 ? zoomed : zoomed / ratio;
    ctx.drawImage(logo, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
    ctx.restore();
  }

  // 5. 描述文字
  if (lines.length) {
    ctx.fillStyle = s.textColor;
    ctx.textAlign = 'center';
    ctx.font = posterFont(s.fontSize);
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, PADDING + s.qrSize + s.gap + s.fontSize + i * lineHeight);
    });
  }

  return { width, height };
}
