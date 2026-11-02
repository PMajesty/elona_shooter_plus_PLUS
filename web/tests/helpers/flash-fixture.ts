// Малые бинарные входы AMF3; не моделируют исполнение Flash или игровой цикл.
export function flashFixture(name: string, data: Record<string, unknown>): Uint8Array {
  const bytes: number[] = [], strings: string[] = [], objects: unknown[] = [];
  let dynamicTrait = false;
  const uint = (number: number) => {
    if (number < 128) bytes.push(number);
    else if (number < 16384) bytes.push((number >>> 7) | 128, number & 127);
    else if (number < 2097152) bytes.push((number >>> 14) | 128, ((number >>> 7) & 127) | 128, number & 127);
    else bytes.push((number >>> 22) | 128, ((number >>> 15) & 127) | 128, ((number >>> 8) & 127) | 128, number & 255);
  };
  const string = (text: string) => {
    const previous = strings.indexOf(text);
    if (text && previous >= 0) { uint(previous * 2); return; }
    const utf = Buffer.from(text); uint(utf.length * 2 + 1); bytes.push(...utf); if (text) strings.push(text);
  };
  const value = (input: unknown): void => {
    if (input === undefined) { bytes.push(0); return; }
    if (input === null) { bytes.push(1); return; }
    if (typeof input === 'boolean') { bytes.push(input ? 3 : 2); return; }
    if (typeof input === 'string') { bytes.push(6); string(input); return; }
    if (typeof input === 'number') {
      if (Number.isInteger(input) && input >= -0x10000000 && input < 0x10000000) { bytes.push(4); uint(input & 0x1fffffff); }
      else { bytes.push(5); const buffer = Buffer.alloc(8); buffer.writeDoubleBE(input); bytes.push(...buffer); }
      return;
    }
    const array = Array.isArray(input), previous = objects.indexOf(input);
    bytes.push(array ? 9 : 10);
    if (previous >= 0) { uint(previous * 2); return; }
    objects.push(input);
    if (array) {
      const dense = Object.keys(input).length === input.length;
      uint(dense ? input.length * 2 + 1 : 1);
      if (!dense) for (const [key, item] of Object.entries(input)) { string(key); value(item); }
      string(''); if (dense) for (const item of input) value(item);
    } else {
      if (dynamicTrait) uint(1); else { uint(11); string(''); dynamicTrait = true; }
      for (const [key, item] of Object.entries(input as object)) { string(key); value(item); }
      string('');
    }
  };
  for (const [key, item] of Object.entries(data)) { string(key); value(item); bytes.push(0); }
  const title = Buffer.from(name), header = Buffer.alloc(22 + title.length);
  header.writeUInt16BE(0xbf); header.writeUInt32BE(header.length + bytes.length - 6, 2);
  header.write('TCSO', 6); header.writeUInt16BE(4, 10); header.writeUInt16BE(title.length, 16);
  title.copy(header, 18); header.writeUInt32BE(3, 18 + title.length);
  return Buffer.concat([header, Buffer.from(bytes)]);
}
