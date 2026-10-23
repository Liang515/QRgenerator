import { $ } from '../state';

/** 色票欄位：原生 color input 透明覆蓋在自訂外觀上，這裡同步色塊與 HEX 文字 */
export const colorPickers = [
  { input: 'qrColorDark', preview: 'qrDarkPreview', text: 'qrDarkHex' },
  { input: 'qrColorLight', preview: 'qrLightPreview', text: 'qrLightHex' },
  { input: 'textColor', preview: 'textColPreview', text: 'textColHex' },
  { input: 'bgColor', preview: 'bgColPreview', text: 'bgColHex' },
] as const;

export function syncColorPickers(): void {
  for (const p of colorPickers) {
    const value = $<HTMLInputElement>(p.input).value;
    $(p.preview).style.backgroundColor = value;
    $(p.text).textContent = value.toUpperCase();
  }
}
