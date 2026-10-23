import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 打包成單一個 dist/index.html (JS、CSS、預設 LOGO 全部內嵌)，
// 直接雙擊用 file:// 開啟也能正常預覽、下載與複製。
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
