const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const data = Buffer.alloc(width * height * 4);
  drawFn(data, width, height);
  // PNG file
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const ihdrChunk = makeChunk('IHDR', ihdr);
  // IDAT
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter none
    data.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcData = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcData) >>> 0);
  return Buffer.concat([len, typeB, data, crc]);
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return c ^ 0xFFFFFFFF;
}

function setPixel(data, w, x, y, r, g, b, a) {
  if (x < 0 || x >= w || y < 0) return;
  const i = (y * w + x) * 4;
  if (i >= data.length) return;
  data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
}

function drawIcon(data, w, h) {
  const cx = w/2, cy = h/2, rad = w/2;
  const s = w / 108;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx*dx + dy*dy <= rad*rad) {
        setPixel(data, w, x, y, 0x16, 0x21, 0x3e, 255);
      }
    }
  }
  // Chat bubble bounds
  const bx1=30*s, by1=26*s, bx2=78*s, by2=64*s, r=4*s;
  const tx=38*s, ty=74*s; // tail point
  for (let y = Math.floor(by1); y <= Math.ceil(by2+10*s); y++) {
    for (let x = Math.floor(bx1); x <= Math.ceil(bx2); x++) {
      let inside = false;
      // Main rect
      if (x >= bx1 && x <= bx2 && y >= by1+r && y <= by2-r) inside = true;
      if (x >= bx1+r && x <= bx2-r && y >= by1 && y <= by2) inside = true;
      // Corners
      if (dist(x,y,bx1+r,by1+r)<=r || dist(x,y,bx2-r,by1+r)<=r ||
          dist(x,y,bx1+r,by2-r)<=r || dist(x,y,bx2-r,by2-r)<=r) inside = true;
      // Tail triangle
      if (y >= by2 && y <= ty) {
        const t = (y - by2) / (ty - by2);
        const lx = bx1 + 8*s + (tx - bx1 - 8*s) * t - (18*s - 8*s) * (1-t);
        const rx = bx1 + 18*s - (18*s - 8*s) * t + 2*s*(1-t);
        if (x >= Math.min(bx1+8*s, tx) && x <= bx1+18*s) inside = true;
      }
      if (inside) setPixel(data, w, x, y, 255, 255, 255, 255);
    }
  }
  // Three dots
  for (const dotX of [44, 54, 64]) {
    const dcx = dotX*s, dcy = 45*s, dr = 3*s;
    for (let y = Math.floor(dcy-dr); y <= Math.ceil(dcy+dr); y++) {
      for (let x = Math.floor(dcx-dr); x <= Math.ceil(dcx+dr); x++) {
        if (dist(x,y,dcx,dcy) <= dr) setPixel(data, w, x, y, 0x16, 0x21, 0x3e, 255);
      }
    }
  }
}

function dist(x1,y1,x2,y2) { return Math.sqrt((x1-x2)**2+(y1-y2)**2); }

const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const resDir = process.argv[2];

for (const [density, size] of Object.entries(sizes)) {
  const png = createPNG(size, size, drawIcon);
  const dir = path.join(resDir, 'mipmap-' + density);
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png);
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png);
  console.log(density + ': ' + size + 'px');
}
console.log('Done!');
