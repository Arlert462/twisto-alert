import { readFileSync, writeFileSync } from 'fs'

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  const rows = lines.slice(1).map(line => {
    const cols = []
    let cur = '', inQuotes = false
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { cols.push(cur); cur = '' }
      else cur += char
    }
    cols.push(cur)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cols[i] })
    return obj
  })
  return rows
}

function distMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const routes = parseCsv(readFileSync('gtfs_data/routes.txt', 'utf-8'))
const trips = parseCsv(readFileSync('gtfs_data/trips.txt', 'utf-8'))
const stopTimes = parseCsv(readFileSync('gtfs_data/stop_times.txt', 'utf-8'))
const stops = parseCsv(readFileSync('gtfs_data/stops.txt', 'utf-8'))

const TRAM_COLORS = { T1: '#22c55e', T2: '#ef4444', T3: '#3b82f6' }

function normalizeHex(hex) {
  if (!hex || hex.length < 6) return null
  const clean = hex.replace('#', '')
  // Évite le blanc/noir/gris pur, illisible sur fond sombre ou trop discret
  if (/^(ffffff|000000|f{6}|0{6})$/i.test(clean)) return null
  return '#' + clean
}

const routeInfoById = {}
for (const r of routes) {
  const isTram = r.route_type === '0'
  routeInfoById[r.route_id] = {
    type: isTram ? 'tram' : 'bus',
    name: r.route_short_name,
    color: isTram
      ? (TRAM_COLORS[r.route_short_name] || '#a855f7')
      : (normalizeHex(r.route_color) || '#f97316'),
  }
}

const tripRoute = {}
for (const t of trips) tripRoute[t.trip_id] = routeInfoById[t.route_id]

const stopLines = {}
for (const st of stopTimes) {
  const info = tripRoute[st.trip_id]
  if (!info) continue
  if (!stopLines[st.stop_id]) stopLines[st.stop_id] = { tram: new Map(), bus: new Map() }
  stopLines[st.stop_id][info.type].set(info.name, info.color)
}

const rawStops = stops
  .filter(s => s.stop_lat && s.stop_lon)
  .map(s => {
    const lines = stopLines[s.stop_id] || { tram: new Map(), bus: new Map() }
    return {
      name: s.stop_name,
      lat: parseFloat(s.stop_lat),
      lon: parseFloat(s.stop_lon),
      tram: lines.tram,
      bus: lines.bus,
    }
  })
  .filter(s => s.tram.size > 0 || s.bus.size > 0)

const MERGE_DISTANCE = 30
const clusters = []
for (const s of rawStops) {
  let target = null
  for (const c of clusters) {
    if (distMeters(s.lat, s.lon, c.lat, c.lon) < MERGE_DISTANCE) { target = c; break }
  }
  if (target) {
    target.members.push(s)
    target.lat = target.members.reduce((a, m) => a + m.lat, 0) / target.members.length
    target.lon = target.members.reduce((a, m) => a + m.lon, 0) / target.members.length
    for (const [k, v] of s.tram) target.tram.set(k, v)
    for (const [k, v] of s.bus) target.bus.set(k, v)
  } else {
    clusters.push({ name: s.name, lat: s.lat, lon: s.lon, tram: new Map(s.tram), bus: new Map(s.bus), members: [s] })
  }
}

const result = clusters.map(c => {
  const tramLines = [...c.tram.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, color]) => ({ name, color }))
  const busLines = [...c.bus.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([name, color]) => ({ name, color }))
  return {
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    isTram: tramLines.length > 0,
    isBus: busLines.length > 0,
    tramLines,
    busLines,
  }
})

writeFileSync('src/data/stops.json', JSON.stringify(result))
console.log(`${rawStops.length} arrêts bruts fusionnés en ${result.length}. Trams: ${result.filter(s => s.isTram).length}, Bus: ${result.filter(s => s.isBus).length}`)

// Vérification rapide de quelques lignes de bus
const sample = ['6A', '6B', '1', '2']
for (const name of sample) {
  const found = routes.find(r => r.route_short_name === name && r.route_type !== '0')
  if (found) console.log(`Ligne ${name} → couleur brute: "${found.route_color}"`)
}
