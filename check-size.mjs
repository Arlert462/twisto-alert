import { readFileSync } from 'fs'
function pngSize(path) {
  const buf = readFileSync(path)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}
console.log('tram:', pngSize('src/assets/tram.png'))
console.log('bus:', pngSize('src/assets/bus.png'))
console.log('report:', pngSize('src/assets/report.png'))
