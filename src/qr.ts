// QR 編碼：產生 module 矩陣 (true = 深色)，並處理超出容量的情況

import qrcode from 'qrcode-generator';

// qrcode-generator 預設只取每個字元的低 8 bit，中文會變亂碼；改用 UTF-8 編碼
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

export type QrResult =
  | { ok: true; size: number; isDark: (row: number, col: number) => boolean }
  | { ok: false; reason: string };

let cache: { text: string; result: QrResult } | null = null;

export function encodeQr(text: string): QrResult {
  if (cache?.text === text) return cache.result;

  let result: QrResult;
  if (!text) {
    result = { ok: false, reason: '請先輸入網址或文字' };
  } else {
    try {
      // 0 = 自動選擇版本；H 級容錯 (約 30%)，讓中心 LOGO 遮住部分碼點仍可讀取
      const qr = qrcode(0, 'H');
      qr.addData(text, 'Byte');
      qr.make();
      result = { ok: true, size: qr.getModuleCount(), isDark: (r, c) => qr.isDark(r, c) };
    } catch {
      const bytes = new TextEncoder().encode(text).length;
      result = {
        ok: false,
        reason: `內容太長了（${bytes} bytes），QR Code 在高容錯模式下最多約 1,270 bytes。請改用短網址。`,
      };
    }
  }
  cache = { text, result };
  return result;
}
