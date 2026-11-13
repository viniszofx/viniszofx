// Minimal ZIP writer (stored entries, no compression). Enough for downloading
// Drive folders and for building blank DOCX/XLSX packages without a dependency.

const table = (() => {
  const values = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    values[index] = value >>> 0;
  }
  return values;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTime(date: Date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

export type ZipEntry = { path: string; data: Uint8Array | string | Blob };

export async function createZip(entries: ZipEntry[], type = "application/zip") {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  const { time, day } = dosTime(new Date());
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data instanceof Blob ? new Uint8Array(await entry.data.arrayBuffer()) : entry.data;
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    // Flag 0x0800 marks UTF-8 names so accents survive on every OS.
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, time, true); local.setUint16(12, day, true); local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    parts.push(local.buffer, name as BlobPart, data as BlobPart);
    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true); header.setUint16(4, 20, true); header.setUint16(6, 20, true); header.setUint16(8, 0x0800, true); header.setUint16(10, 0, true);
    header.setUint16(12, time, true); header.setUint16(14, day, true); header.setUint32(16, crc, true);
    header.setUint32(20, data.length, true); header.setUint32(24, data.length, true); header.setUint16(28, name.length, true);
    header.setUint32(42, offset, true);
    const record = new Uint8Array(46 + name.length);
    record.set(new Uint8Array(header.buffer), 0); record.set(name, 46);
    central.push(record);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((sum, record) => sum + record.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central as BlobPart[], end.buffer], { type });
}
