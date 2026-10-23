// QR 前景／背景色的可讀性檢查 (WCAG 相對亮度)

/** 低於此對比值時，多數手機相機開始難以辨識 */
export const MIN_CONTRAST = 3;

function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 回傳警告文字；顏色沒問題時回傳 null */
export function checkQrColors(dark: string, light: string): string | null {
  if (luminance(dark) > luminance(light)) {
    return '⚠️ 前景色比背景色亮（反色 QR），許多掃描器（例如 LINE、舊款手機相機）會讀不到。建議改成淺底深碼。';
  }
  const ratio = contrastRatio(dark, light);
  if (ratio < MIN_CONTRAST) {
    return `⚠️ 前景與背景對比只有 ${ratio.toFixed(1)}:1，可能掃不到。建議至少 ${MIN_CONTRAST}:1，把前景色調深一點。`;
  }
  return null;
}
