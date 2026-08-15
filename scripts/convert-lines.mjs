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
    headers.forEach((h, i) => obj[h] = cols[i])
    return obj
  })
  return rows
}

const routes = parseCsv(readFileSync('gtfs_data/routes.txt', 'utf-8'))
const trips = parseCsv(readFileSync('gtfs_data/trips.txt', 'utf-8'))
const shapes = parseCsv(readFileSync('gtfs_data/shapes.txt', 'utf-8'))

// Couleurs custom demandées : T1 vert, T2 rouge, T3 bleu (on ignore route_color officiel)
const CUSTOM_COLORS = { T1: '#22c55e', T2: '#ef4444', T3: '#3b82f6' }

const tramRoutes = routes.filter(r => r.route_type === '0')
const tramRouteIds = new Set(tramRoutes.map(r => r.route_id))

// shape_id -> route_id (un seul suffit, un shape n'appartient qu'à une ligne)
const shapeToRoute = {}
for (const t of trips) {
  if (tramRouteIds.has(t.route_id) && t.shape_id) {
    shapeToRoute[t.shape_id] = t.route_id
  }
}

// Regroupe les points par shape_id, triés par séquence
const shapePoints = {}
for (const s of shapes) {
  if (!shapeToRoute[s.shape_id]) continue
  if (!shapePoints[s.shape_id]) shapePoints[s.shape_id] = []
  shapePoints[s.shape_id].push({
    seq: parseInt(s.shape_pt_sequence),
    lat: parseFloat(s.shape_pt_lat),
    lon: parseFloat(s.shape_pt_lon),
  })
}

const features = []
for (const [shapeId, points] of Object.entries(shapePoints)) {
  points.sort((a, b) => a.seq - b.seq)
  const routeId = shapeToRoute[shapeId]
  const route = tramRoutes.find(r => r.route_id === routeId)
  const routeName = route.route_short_name
  features.push({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(p => [p.lon, p.lat]),
    },
    properties: {
      routeId,
      routeName,
      color: CUSTOM_COLORS[routeName] || '#ffffff',
    },
  })
}

const geojson = { type: 'FeatureCollection', features }
writeFileSync('src/data/lines.json', JSON.stringify(geojson))
console.log(`${features.length} tracés extraits (T1/T2/T3 confondus, variantes de direction incluses).`)
