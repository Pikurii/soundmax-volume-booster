// Script to generate PNG icons for Volume Master extension
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, drawFn) {
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(height * (width * 4 + 1));

  // Initialize pixels
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    buffer[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const color = drawFn(x / width, y / height, size);
      buffer[pixelOffset] = color[0];     // R
      buffer[pixelOffset + 1] = color[1]; // G
      buffer[pixelOffset + 2] = color[2]; // B
      buffer[pixelOffset + 3] = color[3]; // A
    }
  }

  const deflated = zlib.deflateSync(buffer);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table & calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Draw the Volume Master icon:
// Sleek rounded square background with vibrant gradient (electric blue to cyan)
// In the center: stylized audio sound wave / volume arcs (like the reference icon)
function drawIcon(u, v, size) {
  // Center is (0.5, 0.5)
  const cx = u - 0.5;
  const cy = v - 0.5;

  // Rounded rectangle background (radius ~ 0.22)
  const r = 0.22;
  const w = 0.44;
  const h = 0.44;
  const dx = Math.max(Math.abs(cx) - (w - r), 0);
  const dy = Math.max(Math.abs(cy) - (h - r), 0);
  const distSq = dx * dx + dy * dy;
  const inBackground = (Math.abs(cx) <= w && Math.abs(cy) <= h - r) ||
                       (Math.abs(cx) <= w - r && Math.abs(cy) <= h) ||
                       distSq <= r * r;

  if (!inBackground) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Smooth anti-aliasing edge
  const edgeDist = Math.sqrt(distSq) - r;
  let bgAlpha = 255;
  if (dx > 0 && dy > 0 && edgeDist > -0.02) {
    const t = (-edgeDist) / 0.02;
    bgAlpha = Math.max(0, Math.min(255, Math.round(t * 255)));
  }

  // Gradient background from vibrant blue #2563eb to cyan #06b6d4
  const tGrad = (u + v) / 2;
  const bgR = Math.round(15 + tGrad * 20);
  const bgG = Math.round(90 + tGrad * 90);
  const bgB = Math.round(230 + tGrad * 25);

  // Sound wave bars / arcs in white
  // 3 vertical rounded sound bars (spectrum / volume waves)
  // Bar 1: x = -0.18, height = 0.22
  // Bar 2: x = -0.02, height = 0.42
  // Bar 3: x = 0.14, height = 0.32
  // Bar 4: x = 0.28, height = 0.18
  const bars = [
    { x: -0.22, h: 0.18, w: 0.07 },
    { x: -0.07, h: 0.36, w: 0.07 },
    { x: 0.08, h: 0.48, w: 0.07 },
    { x: 0.23, h: 0.28, w: 0.07 }
  ];

  let isForeground = false;
  let fgAlpha = 0;

  for (const bar of bars) {
    const bdx = Math.abs(cx - bar.x) - (bar.w / 2);
    const bdy = Math.abs(cy) - (bar.h / 2);
    if (bdx <= 0 && bdy <= 0) {
      isForeground = true;
      fgAlpha = 255;
      break;
    } else if (bdx <= 0.015 && bdy <= 0.015) {
      isForeground = true;
      fgAlpha = 180;
    }
  }

  if (isForeground) {
    return [255, 255, 255, bgAlpha];
  }

  return [bgR, bgG, bgB, bgAlpha];
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const pngBuf = createPNG(size, drawIcon);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
  console.log(`Generated icon${size}.png (${size}x${size})`);
});
