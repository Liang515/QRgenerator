# QR Gen Studio

<img src="logo.png" alt="QR Gen Studio Logo" width="128" height="128" />

輸入網址或文字，產生可下載的 QR Code 圖片。可以調整顏色、尺寸、加上底部說明文字和中心 LOGO。

## 功能

- **配色預設**：五組配色可一鍵套用，也能分別調整條碼前景色、背景色、文字顏色和海報背景色
- **可讀性檢查**：前景和背景對比不足，或是反色（淺色碼、深色底）時會顯示警告
- **中心 LOGO**：可用預設 LOGO、上傳自訂圖片（PNG、JPG、SVG）或不使用，並能調整大小、圓角和裁切
- **說明文字**：中文逐字換行，英文以單字換行，也可以按 Enter 手動換行
- **下載與複製**：固定以 3 倍解析度輸出 PNG（QR 大小 280 時寬 1200px），不受螢幕解析度影響；也能直接複製到剪貼簿
- **記住設定**：上次的網址、配色和尺寸會存在瀏覽器裡（自訂 LOGO 圖片除外）
- 內容超過 QR Code 容量時會提示，並停用下載按鈕

## 使用方式

### 直接使用
執行 `npm run build` 後，用瀏覽器開啟 `dist/index.html` 即可（所有程式和預設 LOGO 都已內嵌在這個檔案裡，雙擊開啟也能用）。

> 用 `file://` 開啟時，部分瀏覽器不允許「複製圖片」，請改用下載。

### 開發

```bash
npm install
npm run dev      # 開發伺服器 http://localhost:5173
npm run build    # 型別檢查並輸出到 dist/
```

## 專案結構

```
index.html            頁面結構
public/               manifest 與 App 圖示
src/
  main.ts             初始化與事件綁定
  state.ts            表單狀態與 localStorage
  presets.ts          配色預設
  qr.ts               QR 編碼（qrcode-generator，H 級容錯，UTF-8）
  renderer.ts         繪製海報（預覽和匯出共用）
  export.ts           下載 PNG、複製到剪貼簿
  logo.ts             LOGO 載入與快取
  text.ts             說明文字換行
  contrast.ts         顏色對比檢查
  ui/                 Toast、色票欄位
  styles.css
```

## 技術

TypeScript、Vite（`vite-plugin-singlefile` 打包成單一 HTML）、[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)。字型使用 Google Fonts，離線時會改用系統字型。

## 小提醒

- QR Code 使用 **H 級容錯**（約可容忍 30% 損毀），中心 LOGO 建議維持在 30% 以下的大小。
- QR 四周會留一圈條碼背景色的安靜區，放在深色海報上也掃得到。
- 網址越長，QR 碼點越密，建議使用短網址。

## 授權

[MIT License](LICENSE)
