/** Пунктуация, которая не может начинать строку. */
const NO_LINE_START = new Set(Array.from('，。、！？：；）」』》〉】〕…％%,.!?:;)]}·ー々'));
/** Пунктуация, которая не может заканчивать строку. */
const NO_LINE_END = new Set(Array.from('（「『《〈【〔“‘([{'));
/** Подряд идущие латинские буквы, цифры и ASCII-пунктуация образуют неразрывное слово; остальные символы переносятся по одному. */
const TOKEN = /[A-Za-z0-9À-ɏЀ-ӿ.,:;!?%+\-/'"#()[\]{}*&@$^=_<>~]+| +|[\s\S]/gu;

/**
 * Перенос китайского текста по символам: английские слова и числа не разрываются, пунктуация подчиняется простым правилам.
 * wrap_cjk в tools/localize_web_assets.py создаёт китайскую графику по тем же правилам.
 */
export function wrapCjkText(text: string, measure: (value: string) => number, width: number): string {
  if (!(width > 0)) return text;
  const output: string[] = [];
  for (const paragraph of text.split(/\r\n|\r|\n/)) {
    const start = output.length;
    let line = '';
    const push = () => { output.push(line.replace(/ +$/, '')); line = ''; };
    for (let token of paragraph.match(TOKEN) ?? []) {
      if (/^ +$/.test(token)) {
        // Пробелы в начале строки отбрасываются; если пробел не помещается, строка переносится.
        if (line && measure(line + token) <= width) line += token;
        else if (line) push();
        continue;
      }
      if (line && measure(line + token) > width) {
        // Закрывающая пунктуация остаётся в конце текущей строки и не начинает новую.
        if (NO_LINE_START.has(Array.from(token)[0])) { line += token; continue; }
        // Открывающая скобка в конце строки переносится на следующую.
        const characters = Array.from(line);
        let carried = '';
        while (characters.length > 1 && NO_LINE_END.has(characters[characters.length - 1])) carried = characters.pop()! + carried;
        line = characters.join(''); push(); line = carried;
      }
      // Слишком длинное английское слово разбивается по символам, чтобы не выходить за край.
      while (!line && Array.from(token).length > 1 && measure(token) > width) {
        const letters = Array.from(token);
        let head = '';
        while (letters.length && measure(head + letters[0]) <= width) head += letters.shift();
        if (!head) head = letters.shift()!;
        output.push(head); token = letters.join('');
      }
      line += token;
    }
    if (line || output.length === start) push();
  }
  return output.join('\n');
}
