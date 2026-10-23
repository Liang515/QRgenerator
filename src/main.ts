import './styles.css';
import { $, type AppState, type LogoMode, readForm, writeForm, saveState, loadState } from './state';
import { presets, DEFAULT_PRESET } from './presets';
import { encodeQr } from './qr';
import { defaultLogoUrl, getLogo, loadCustomLogo, loadDefaultLogo } from './logo';
import { drawPoster } from './renderer';
import { checkQrColors } from './contrast';
import { copyPng, downloadPng } from './export';
import { showToast } from './ui/toast';
import { colorPickers, syncColorPickers } from './ui/colorPicker';

let logoMode: LogoMode = 'default';
let activePreset: string | null = DEFAULT_PRESET;

const currentState = (): AppState => readForm(logoMode, activePreset);

// --- 繪製預覽 (同步執行：LOGO 與字型都已事先載入並快取) ---
function render(): void {
  const s = currentState();

  $('qrVal').textContent = String(s.qrSize);
  $('fontVal').textContent = String(s.fontSize);
  $('gapVal').textContent = String(s.gap);
  $('logoVal').textContent = `${Math.round(s.logoScale * 100)}%`;
  $('logoRadiusVal').textContent = String(s.logoRadius);
  $('logoZoomVal').textContent = `${s.logoZoom.toFixed(2)}x`;

  const warning = checkQrColors(s.qrDark, s.qrLight);
  const warningBox = $('contrastWarning');
  warningBox.textContent = warning ?? '';
  warningBox.classList.toggle('show', warning !== null);

  const qr = encodeQr(s.url);
  const preview = $('previewArea');
  preview.classList.toggle('has-error', !qr.ok);
  $<HTMLButtonElement>('downloadBtn').disabled = !qr.ok;
  $<HTMLButtonElement>('copyBtn').disabled = !qr.ok;
  if (!qr.ok) {
    $('qrError').textContent = qr.reason;
  } else {
    const canvas = $<HTMLCanvasElement>('mainCanvas');
    const { width, height } = drawPoster(canvas, s, qr, getLogo(s.logoMode), window.devicePixelRatio || 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  saveState(s);
}

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: number | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}
const debouncedRender = debounce(render, 60);

// --- 配色預設 ---
function buildPresetCards(): void {
  const grid = $('presetGrid');
  for (const [key, p] of Object.entries(presets)) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'preset-card';
    card.dataset.preset = key;

    const dots = document.createElement('div');
    dots.className = 'preset-colors';
    for (const color of [p.canvasBg, p.qrLight, p.qrDark]) {
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.background = color;
      dots.append(dot);
    }
    const name = document.createElement('span');
    name.className = 'preset-name';
    name.textContent = p.name;

    card.append(dots, name);
    card.addEventListener('click', () => applyPreset(key));
    grid.append(card);
  }
}

function markActivePreset(): void {
  document.querySelectorAll<HTMLElement>('.preset-card').forEach((card) => {
    const active = card.dataset.preset === activePreset;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', String(active));
  });
}

function applyPreset(key: string): void {
  const p = presets[key];
  if (!p) return;
  activePreset = key;
  $<HTMLInputElement>('bgColor').value = p.canvasBg;
  $<HTMLInputElement>('textColor').value = p.text;
  $<HTMLInputElement>('qrColorDark').value = p.qrDark;
  $<HTMLInputElement>('qrColorLight').value = p.qrLight;
  syncColorPickers();
  markActivePreset();
  render();
  showToast(`已套用「${p.name}」配色`);
}

// --- LOGO 模式 ---
function setLogoMode(mode: LogoMode): void {
  logoMode = mode;
  document.querySelectorAll<HTMLElement>('.logo-mode-btn').forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  });
  $('uploadGroup').hidden = mode !== 'custom';
  document.querySelectorAll<HTMLElement>('.logo-option').forEach((el) => {
    el.hidden = mode === 'none';
  });
  render();
}

function bindEvents(): void {
  // 文字與滑桿：輸入時延遲重繪
  for (const id of ['urlInput', 'descInput', 'qrSlider', 'fontSlider', 'gapSlider', 'logoSlider', 'logoRadiusSlider', 'logoZoomSlider']) {
    $(id).addEventListener('input', debouncedRender);
  }

  // 手動調色會取消預設配色的選取狀態
  for (const p of colorPickers) {
    $(p.input).addEventListener('input', () => {
      activePreset = null;
      syncColorPickers();
      markActivePreset();
      debouncedRender();
    });
  }

  document.querySelectorAll<HTMLElement>('.logo-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLogoMode(btn.dataset.mode as LogoMode));
  });

  $<HTMLInputElement>('logoInput').addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await loadCustomLogo(file);
    } catch {
      showToast('這個檔案無法讀取，請換一張圖片', true);
      return;
    }
    $('uploadStatusMain').textContent = `已選取：${file.name}`;
    $('uploadStatusSub').textContent = '點擊可重新上傳';
    showToast('已套用自訂 LOGO');
    render();
  });

  $('downloadBtn').addEventListener('click', async () => {
    try {
      const { width, height } = await downloadPng(currentState());
      showToast(`已下載 PNG（${width} × ${height} px）`);
    } catch (err) {
      console.error('下載失敗:', err);
      showToast('下載失敗，請重新整理頁面後再試一次', true);
    }
  });

  $('copyBtn').addEventListener('click', () => {
    copyPng(currentState())
      .then(() => showToast('圖片已複製到剪貼簿'))
      .catch((err: Error) => {
        console.error('剪貼簿寫入錯誤:', err);
        if (err.message === 'unsupported') {
          showToast('這個瀏覽器不支援複製圖片，請改用下載', true);
        } else if (location.protocol === 'file:') {
          showToast('用 file:// 開啟時瀏覽器可能不允許複製，請改用下載', true);
        } else {
          showToast('複製失敗，瀏覽器拒絕寫入剪貼簿，請改用下載', true);
        }
      });
  });

  $('gridToggle').addEventListener('click', () => {
    const hidden = $('previewArea').classList.toggle('no-grid');
    $('gridToggle').classList.toggle('active', !hidden);
    $('gridToggle').setAttribute('aria-pressed', String(!hidden));
  });

  $('toggleBtn').addEventListener('click', () => {
    const collapsed = $('previewArea').classList.toggle('collapsed');
    $('toggleBtn').textContent = collapsed ? '展開預覽 👁️' : '收合預覽 ✕';
  });

  // 螢幕倍率改變 (例如視窗拖到另一個螢幕) 時重繪，維持清晰度
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', render);

  // 網頁字型較晚載入完成時，重新量字寬並重繪
  document.fonts.addEventListener('loadingdone', debouncedRender);
}

async function init(): Promise<void> {
  $<HTMLImageElement>('headerLogo').src = defaultLogoUrl;
  buildPresetCards();

  // 還原上次設定；欄位初始值當作預設值
  const saved = loadState();
  if (saved) {
    const merged = { ...readForm('default', DEFAULT_PRESET), ...saved };
    writeForm(merged);
    logoMode = merged.logoMode === 'custom' ? 'default' : merged.logoMode; // 自訂圖片無法跨工作階段保存
    activePreset = merged.preset;
  }
  syncColorPickers();
  markActivePreset();
  bindEvents();

  // 等預設 LOGO 和網頁字型都準備好再畫，避免第一次量字寬時用到備用字型
  await Promise.allSettled([loadDefaultLogo(), document.fonts.ready]);
  setLogoMode(logoMode);
}

init();
