// 應用程式狀態：表單 <-> AppState 的雙向同步，以及 localStorage 記憶上次設定

export type LogoMode = 'default' | 'custom' | 'none';

export interface AppState {
  url: string;
  desc: string;
  qrSize: number;
  fontSize: number;
  gap: number;
  /** Logo 佔 QR 寬度的比例 (0.15 ~ 0.30) */
  logoScale: number;
  logoRadius: number;
  logoZoom: number;
  qrDark: string;
  qrLight: string;
  textColor: string;
  bgColor: string;
  logoMode: LogoMode;
  /** 目前套用中的配色預設；手動調色後為 null */
  preset: string | null;
}

const STORAGE_KEY = 'qr-gen-studio:v2';

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`找不到元素 #${id}`);
  return el as T;
};

const input = (id: string) => $<HTMLInputElement>(id);
const num = (id: string) => Number(input(id).value);

/** 由表單欄位組合出 AppState (logoMode 與 preset 不在表單裡，由呼叫端提供) */
export function readForm(logoMode: LogoMode, preset: string | null): AppState {
  return {
    url: input('urlInput').value.trim(),
    desc: $<HTMLTextAreaElement>('descInput').value,
    qrSize: num('qrSlider'),
    fontSize: num('fontSlider'),
    gap: num('gapSlider'),
    logoScale: num('logoSlider') / 100,
    logoRadius: num('logoRadiusSlider'),
    logoZoom: num('logoZoomSlider'),
    qrDark: input('qrColorDark').value,
    qrLight: input('qrColorLight').value,
    textColor: input('textColor').value,
    bgColor: input('bgColor').value,
    logoMode,
    preset,
  };
}

/** 把狀態寫回表單欄位 (用於還原上次設定) */
export function writeForm(s: AppState): void {
  input('urlInput').value = s.url;
  $<HTMLTextAreaElement>('descInput').value = s.desc;
  input('qrSlider').value = String(s.qrSize);
  input('fontSlider').value = String(s.fontSize);
  input('gapSlider').value = String(s.gap);
  input('logoSlider').value = String(Math.round(s.logoScale * 100));
  input('logoRadiusSlider').value = String(s.logoRadius);
  input('logoZoomSlider').value = String(s.logoZoom);
  input('qrColorDark').value = s.qrDark;
  input('qrColorLight').value = s.qrLight;
  input('textColor').value = s.textColor;
  input('bgColor').value = s.bgColor;
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // 隱私模式或儲存空間被封鎖時忽略
  }
}

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : null;
  } catch {
    return null;
  }
}
