// Minimal Sponge Schematic v2 (.schem) writer.
// Format: gzipped NBT. Spec: https://github.com/SpongePowered/Schematic-Specification
import pako from "pako";
import type { Voxels } from "./shapes";

// --- NBT writer (big-endian) ---
const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_SHORT = 2;
const TAG_INT = 3;
const TAG_STRING = 8;
const TAG_COMPOUND = 10;
const TAG_BYTE_ARRAY = 7;

class NBTWriter {
  private chunks: Uint8Array[] = [];
  private buf = new Uint8Array(1024);
  private pos = 0;

  private ensure(n: number) {
    if (this.pos + n > this.buf.length) {
      this.chunks.push(this.buf.subarray(0, this.pos));
      this.buf = new Uint8Array(Math.max(1024, n));
      this.pos = 0;
    }
  }
  byte(v: number) { this.ensure(1); this.buf[this.pos++] = v & 0xff; }
  short(v: number) { this.ensure(2); this.buf[this.pos++] = (v >> 8) & 0xff; this.buf[this.pos++] = v & 0xff; }
  int(v: number) {
    this.ensure(4);
    this.buf[this.pos++] = (v >>> 24) & 0xff;
    this.buf[this.pos++] = (v >>> 16) & 0xff;
    this.buf[this.pos++] = (v >>> 8) & 0xff;
    this.buf[this.pos++] = v & 0xff;
  }
  bytes(arr: Uint8Array) {
    this.ensure(arr.length);
    this.buf.set(arr, this.pos);
    this.pos += arr.length;
  }
  string(s: string) {
    const enc = new TextEncoder().encode(s);
    this.short(enc.length);
    this.bytes(enc);
  }
  finish(): Uint8Array {
    this.chunks.push(this.buf.subarray(0, this.pos));
    const total = this.chunks.reduce((a, c) => a + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of this.chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  tagHeader(type: number, name: string) { this.byte(type); this.string(name); }
}

function writeVarInt(values: number[]): Uint8Array {
  // Worst case 5 bytes per value
  const out = new Uint8Array(values.length * 5);
  let p = 0;
  for (let v of values) {
    while ((v & ~0x7f) !== 0) {
      out[p++] = (v & 0x7f) | 0x80;
      v >>>= 7;
    }
    out[p++] = v & 0x7f;
  }
  return out.subarray(0, p);
}

export interface SchemOptions {
  block?: string; // e.g. "minecraft:stone"
  dataVersion?: number; // MC data version, default 1.20.4 = 3700
}

export function voxelsToSchem(voxels: Voxels, opts: SchemOptions = {}): Uint8Array {
  const block = opts.block ?? "minecraft:stone";
  const dataVersion = opts.dataVersion ?? 3700;

  const height = voxels.length; // layers (Y)
  const length = voxels[0]?.length ?? 0; // Z
  const width = voxels[0]?.[0]?.length ?? 0; // X

  // BlockData order: index = x + z*Width + y*Width*Length
  const total = width * length * height;
  const indices = new Array<number>(total);
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const filled = voxels[y][z][x];
        indices[x + z * width + y * width * length] = filled ? 1 : 0;
      }
    }
  }
  const blockData = writeVarInt(indices);

  const w = new NBTWriter();
  // Root compound named "Schematic"
  w.tagHeader(TAG_COMPOUND, "Schematic");

  w.tagHeader(TAG_INT, "Version"); w.int(2);
  w.tagHeader(TAG_INT, "DataVersion"); w.int(dataVersion);
  w.tagHeader(TAG_SHORT, "Width"); w.short(width);
  w.tagHeader(TAG_SHORT, "Height"); w.short(height);
  w.tagHeader(TAG_SHORT, "Length"); w.short(length);

  // Palette
  w.tagHeader(TAG_COMPOUND, "Palette");
  w.tagHeader(TAG_INT, "minecraft:air"); w.int(0);
  w.tagHeader(TAG_INT, block); w.int(1);
  w.byte(TAG_END);

  w.tagHeader(TAG_INT, "PaletteMax"); w.int(2);

  // BlockData: byte array (varint stream)
  w.tagHeader(TAG_BYTE_ARRAY, "BlockData");
  w.int(blockData.length);
  w.bytes(blockData);

  w.byte(TAG_END); // close root

  const nbt = w.finish();
  return pako.gzip(nbt);
}

export function downloadSchem(voxels: Voxels, filename: string, opts?: SchemOptions) {
  const data = voxelsToSchem(voxels, opts);
  // Convert to a fresh ArrayBuffer for Blob to satisfy strict typing
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  const blob = new Blob([ab], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}