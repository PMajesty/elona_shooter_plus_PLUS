// Формат: Adobe AMF3 (2013), оболочка TCSO — ruffle-rs/rust-flash-lso/src/read.rs.
export interface FlashSharedObject { name: string; data: Record<string, unknown> }
const MAX_VALUES = 100000;
const decoder = new TextDecoder('utf-8', { fatal: true });

/** Читает используемые игрой типы AMF3, не создавая экземпляры классов и не исполняя код. */
export function readFlashSharedObject(bytes: Uint8Array): FlashSharedObject {
  if (bytes.length > 1000000) throw new Error('The save file is too large.');
  let position = 0, values = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const strings: string[] = [], objects: { marker: number; value: unknown }[] = [];
  const traits: { dynamic: boolean; names: string[] }[] = [];
  const invalid = (): never => { throw new Error('Invalid or unsupported Flash SharedObject file.'); };
  const take = (length: number): Uint8Array => {
    if (!Number.isSafeInteger(length) || length < 0 || position + length > bytes.length) return invalid();
    const result = bytes.subarray(position, position + length); position += length; return result;
  };
  const u8 = () => take(1)[0];
  const u16 = () => { take(2); return view.getUint16(position - 2); };
  const u32 = () => { take(4); return view.getUint32(position - 4); };
  const text = (length: number) => decoder.decode(take(length));
  const u29 = () => {
    let value = 0;
    for (let i = 0; i < 3; i++) {
      const byte = u8(); value = value * 128 + (byte & 127);
      if (!(byte & 128)) return value;
    }
    return value * 256 + u8();
  };
  const string = (): string => {
    const header = u29();
    if (!(header & 1)) {
      const value = strings[header >>> 1]; return value === undefined ? invalid() : value;
    }
    const value = text(header >>> 1);
    if (value) strings.push(value);
    return value;
  };
  const property = (target: object, key: string, value: unknown) => {
    if (!key || ['__proto__', 'prototype', 'constructor', 'length'].includes(key) || Object.hasOwn(target, key)
      || Array.isArray(target) && /^\d+$/.test(key) && Number(key) >= MAX_VALUES) return invalid();
    Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
  };
  const reference = (marker: number, header: number): unknown => {
    const entry = objects[header >>> 1];
    return entry?.marker === marker ? entry.value : invalid();
  };
  const value = (depth = 0): unknown => {
    if (++values > MAX_VALUES || depth > 64) return invalid();
    const marker = u8();
    if (marker === 0) return undefined;
    if (marker === 1) return null;
    if (marker === 2 || marker === 3) return marker === 3;
    if (marker === 4) { const number = u29(); return number & 0x10000000 ? number - 0x20000000 : number; }
    if (marker === 5) { take(8); return view.getFloat64(position - 8); }
    if (marker === 6) return string();
    if (marker !== 9 && marker !== 10) return invalid();
    const header = u29();
    if (!(header & 1)) return reference(marker, header);
    if (marker === 9) {
      const length = header >>> 1;
      if (length > MAX_VALUES) return invalid();
      const array: unknown[] = [];
      objects.push({ marker, value: array });
      for (let key = string(); key; key = string()) property(array, key, value(depth + 1));
      for (let i = 0; i < length; i++) property(array, String(i), value(depth + 1));
      return array;
    }
    let shape: typeof traits[number];
    if (!(header & 2)) {
      shape = traits[header >>> 2]; if (!shape) return invalid();
    } else {
      if (header & 4) return invalid(); // IExternalizable не используется в сохранениях игры.
      string(); // Имя класса остаётся данными; конструктор не вызывается.
      const count = header >>> 4;
      if (count > MAX_VALUES) return invalid();
      shape = { dynamic: Boolean(header & 8), names: Array.from({ length: count }, () => string()) };
      traits.push(shape);
    }
    const object: Record<string, unknown> = Object.create(null);
    objects.push({ marker, value: object });
    for (const key of shape.names) property(object, key, value(depth + 1));
    if (shape.dynamic) for (let key = string(); key; key = string()) property(object, key, value(depth + 1));
    return object;
  };
  if (u16() !== 0xbf) return invalid();
  const length = u32();
  if (length !== bytes.length - 6 || text(4) !== 'TCSO' || u16() !== 4 || u32() !== 0) return invalid();
  const name = text(u16());
  if (u32() !== 3) throw new Error('Only ActionScript 3 SharedObject saves are supported.');
  const data: Record<string, unknown> = Object.create(null);
  while (position < bytes.length) { const key = string(); property(data, key, value()); if (u8() !== 0) return invalid(); }
  return { name, data };
}
