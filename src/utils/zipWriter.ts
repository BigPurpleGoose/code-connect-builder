/**
 * Minimal ZIP file creator — pure TypeScript, no dependencies.
 * Uses the STORED (no compression) method for simplicity.
 */

// ─── CRC-32 table ─────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++)
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(v: DataView, off: number, val: number) { v.setUint16(off, val, true); }
function u32(v: DataView, off: number, val: number) { v.setUint32(off, val, true); }

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ZipEntry {
  name: string;    // filename inside the zip (may include slashes for folders)
  content: string; // UTF-8 text content
}

/** Build a ZIP Blob from an array of text file entries. */
export function createZipBlob(files: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  type LocalInfo = { nameBytes: Uint8Array; dataBytes: Uint8Array; crc: number; offset: number };
  const infos: LocalInfo[] = [];
  const localParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const dataBytes = enc.encode(file.content);
    const crc = crc32(dataBytes);

    const header = new Uint8Array(30 + nameBytes.length);
    const v = new DataView(header.buffer);
    u32(v, 0, 0x04034b50); u16(v, 4, 20); u16(v, 6, 0); u16(v, 8, 0);
    u16(v, 10, 0); u16(v, 12, 0);
    u32(v, 14, crc);
    u32(v, 18, dataBytes.length); u32(v, 22, dataBytes.length);
    u16(v, 26, nameBytes.length); u16(v, 28, 0);
    header.set(nameBytes, 30);

    infos.push({ nameBytes, dataBytes, crc, offset: localOffset });
    localOffset += header.length + dataBytes.length;
    localParts.push(header, dataBytes);
  }

  // Central directory
  const cdParts: Uint8Array[] = [];
  let cdSize = 0;
  for (const info of infos) {
    const cd = new Uint8Array(46 + info.nameBytes.length);
    const v = new DataView(cd.buffer);
    u32(v, 0, 0x02014b50); u16(v, 4, 20); u16(v, 6, 20); u16(v, 8, 0); u16(v, 10, 0);
    u16(v, 12, 0); u16(v, 14, 0);
    u32(v, 16, info.crc);
    u32(v, 20, info.dataBytes.length); u32(v, 24, info.dataBytes.length);
    u16(v, 28, info.nameBytes.length); u16(v, 30, 0); u16(v, 32, 0);
    u16(v, 34, 0); u16(v, 36, 0); u32(v, 38, 0); u32(v, 42, info.offset);
    cd.set(info.nameBytes, 46);
    cdParts.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0);
  u16(ev, 8, infos.length); u16(ev, 10, infos.length);
  u32(ev, 12, cdSize); u32(ev, 16, localOffset); u16(ev, 20, 0);

  return new Blob(
    ([...localParts, ...cdParts, eocd] as unknown[]) as BlobPart[],
    { type: 'application/zip' },
  );
}

/** Trigger browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
