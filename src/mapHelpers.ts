export function loadIconImage(map: any, name: string, url: string) {
  if (map.hasImage(name)) return
  const img = new Image()
  img.onload = () => { if (!map.hasImage(name)) map.addImage(name, img) }
  img.src = url
}

export function triangleSvg(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10">
    <path d="M7 10 L0 0 L14 0 Z" fill="${color}"/>
  </svg>`
}

export function loadSvgImage(map: any, name: string, svg: string) {
  if (map.hasImage(name)) return
  const img = new Image()
  img.onload = () => { if (!map.hasImage(name)) map.addImage(name, img) }
  img.src = 'data:image/svg+xml;base64,' + btoa(svg)
}

export function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return "à l'instant"
  if (mins === 1) return 'il y a 1 min'
  return `il y a ${mins} min`
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
