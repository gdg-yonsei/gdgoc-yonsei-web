// Usage: node crop.mjs <in.png> <out.png> <top> <height> [left] [width]
import sharp from 'sharp'
const [input, out, top, height, left = '0', width] = process.argv.slice(2)
const meta = await sharp(input).metadata()
const w = width ? Number(width) : meta.width - Number(left)
const h = Math.min(Number(height), meta.height - Number(top))
await sharp(input).extract({ left: Number(left), top: Number(top), width: w, height: h }).toFile(out)
console.log(out, `${meta.width}x${meta.height}`, '→', `${w}x${h}`)
