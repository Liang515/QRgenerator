// LOGO 載入與快取：載入一次就重複使用，render() 本身保持同步，避免舊的非同步結果蓋掉新畫面

// 預設 LOGO 由 Vite 打包時內嵌成 data URL，file:// 開啟時也不會污染 canvas
import defaultLogoUrl from './assets/logo-256.png';

export { defaultLogoUrl };

type LogoSource = HTMLImageElement | ImageBitmap;

let defaultLogo: LogoSource | null = null;
let customLogo: LogoSource | null = null;
/** 每次換自訂圖片就 +1，讓預先產生的分享檔知道要重做 */
export let customLogoVersion = 0;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`無法載入圖片：${src.slice(0, 60)}`));
    img.src = src;
  });
}

export async function loadDefaultLogo(): Promise<void> {
  defaultLogo = await loadImage(defaultLogoUrl);
}

/** 讀取使用者上傳的圖片。SVG 無法用 createImageBitmap，改走 <img> */
export async function loadCustomLogo(file: File): Promise<void> {
  if (file.type === 'image/svg+xml') {
    const url = URL.createObjectURL(file);
    try {
      customLogo = await loadImage(url);
    } finally {
      // 圖片已解碼，SVG 的 <img> 仍可繼續繪製
      URL.revokeObjectURL(url);
    }
  } else {
    customLogo = await createImageBitmap(file);
  }
  customLogoVersion++;
}

export function getLogo(mode: 'default' | 'custom' | 'none'): LogoSource | null {
  if (mode === 'default') return defaultLogo;
  if (mode === 'custom') return customLogo;
  return null;
}
