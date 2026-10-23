// 配色預設：QR 本體一律「淺底深碼」且對比 ≥ 3:1，確保各種掃描器都讀得到

export interface Preset {
  name: string;
  canvasBg: string;
  text: string;
  qrDark: string;
  qrLight: string;
}

export const presets: Record<string, Preset> = {
  classic: {
    name: 'QR Gen 經典',
    canvasBg: '#FAF8F5',
    text: '#2D3A44',
    qrDark: '#2D3A44',
    qrLight: '#FAF8F5',
  },
  ocean: {
    name: '品牌海洋藍',
    canvasBg: '#F3F8FD',
    text: '#1E3A5F',
    qrDark: '#1E4E8C',
    qrLight: '#FFFFFF',
  },
  mint: {
    name: '翡翠薄荷',
    canvasBg: '#FAF8F5',
    text: '#2D3A44',
    qrDark: '#3F7F66',
    qrLight: '#FAF8F5',
  },
  forest: {
    name: '森林暗奢',
    canvasBg: '#2D3A44',
    text: '#FAF7F2',
    qrDark: '#3F7F66',
    qrLight: '#FAF7F2',
  },
  luxe: {
    // 舊版是黑底金碼 (反色)，改為黑色海報上放米白 QR 卡片、金棕色碼點
    name: '香檳摩登',
    canvasBg: '#1A1A1A',
    text: '#F7F5F0',
    qrDark: '#8A6D3B',
    qrLight: '#F7F5F0',
  },
};

export const DEFAULT_PRESET = 'classic';
