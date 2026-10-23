// 描述文字換行：中日韓文字可逐字斷行，英文與數字以單字為單位斷行，並保留手動換行

// 拉丁字母／數字連成一個單字；其餘 (中文、標點、空白) 各自獨立
const TOKEN_RE = /[\p{Script=Latin}\p{N}'’\-_.@/:]+|\s+|./gsu;

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let cur = '';
    for (const token of paragraph.match(TOKEN_RE) ?? []) {
      const next = cur + token;
      if (ctx.measureText(next).width <= maxWidth) {
        cur = next;
        continue;
      }
      if (/^\s+$/.test(token)) {
        // 行尾空白直接吃掉，不帶到下一行
        lines.push(cur);
        cur = '';
        continue;
      }
      if (cur) lines.push(cur.trimEnd());
      cur = '';
      // 單一單字就比整行還寬時，只好逐字切開
      for (const ch of token) {
        if (cur && ctx.measureText(cur + ch).width > maxWidth) {
          lines.push(cur);
          cur = ch;
        } else {
          cur += ch;
        }
      }
    }
    lines.push(cur.trimEnd());
  }
  // 去掉尾端多餘的空行
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}
