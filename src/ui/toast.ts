import { $ } from '../state';

let hideTimer: number | undefined;

export function showToast(text: string, isError = false): void {
  const toast = $('toastBox');
  $('toastText').textContent = text;
  $('toastIcon').textContent = isError ? '⚠️' : '✨';
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  // 連續觸發時重新計時，避免前一則的計時器提早關掉新訊息
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
}
