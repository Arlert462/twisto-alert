import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import Map, { Source, Layer, Marker, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import stopsData from './data/stops.json'
import linesData from './data/lines.json'
import busIconUrl from './assets/bus.png'
import tramIconUrl from './assets/tram.png'
import reportIconUrl from './assets/report.png'
import { socket } from './socket'
import type { StopInfo, Report, SheetStep, ReportType } from './types'
import { loadIconImage, loadSvgImage, triangleSvg } from './mapHelpers'
import { LocateIcon } from './components/Icons'
import BottomSheet from './components/BottomSheet'
import ReportsPanel from './components/ReportsPanel'

setWorkerUrl(workerUrl)

const CAEN_CENTER = { longitude: -0.3707, latitude: 49.1829 }
const TRAM_BORDER = '#a855f7'
const BUS_BORDER = '#f97316'

export default function MapView() {
  const mapRef = useRef<MapRef>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedStop, setSelectedStop] = useState<StopInfo | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [sheetStep, setSheetStep] = useState<SheetStep>('main')
  const [reports, setReports] = useState<Report[]>([])
  const [connected, setConnected] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }
    function onSync(list: Report[]) { setReports(list) }
    function onUpdated(report: Report) {
      setReports((prev) => [...prev.filter((r) => r.key !== report.key), report])
    }
    function onRemoved(key: string) {
      setReports((prev) => prev.filter((r) => r.key !== key))
    }
    function onError({ reason }: { reason: string }) {
      const message = reason === 'cooldown'
        ? 'Attends quelques secondes avant de signaler à nouveau.'
        : reason === 'quota'
          ? 'Trop de signalements envoyés récemment, réessaie plus tard.'
          : 'Signalement invalide.'
      setLocationError(message)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reports:sync', onSync)
    socket.on('report:updated', onUpdated)
    socket.on('report:removed', onRemoved)
    socket.on('report:error', onError)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reports:sync', onSync)
      socket.off('report:updated', onUpdated)
      socket.off('report:removed', onRemoved)
      socket.off('report:error', onError)
    }
  }, [])

  const reportedIdxSet = useMemo(() => new Set(reports.map((r) => r.stopIdx)), [reports])

  const stopsGeoJson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: (stopsData as any[]).map((s, idx) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      properties: {
        idx, name: s.name, isTram: s.isTram, isBus: s.isBus,
        tramLines: JSON.stringify(s.tramLines), busLines: JSON.stringify(s.busLines),
        hasReport: reportedIdxSet.has(idx),
      },
    })),
  }), [reportedIdxSet])

  const enableLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\u2019est pas supportée par ce navigateur.')
      return
    }
    setLocationError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 })
        setLocating(false)
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) => setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
            (err) => console.error('watchPosition:', err),
            { enableHighAccuracy: true }
          )
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Localisation refusée. Ouvre les paramètres du site pour l\u2019autoriser, puis réessaie.')
        } else {
          setLocationError('Impossible de récupérer ta position. Réessaie.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const recenterOnUser = useCallback(() => {
    if (userPos && mapRef.current) {
      mapRef.current.flyTo({ center: [userPos.lon, userPos.lat], zoom: 16 })
    } else {
      enableLocation()
    }
  }, [userPos, enableLocation])

  const buildStopInfo = useCallback((idx: number): StopInfo => {
    const s = (stopsData as any[])[idx]
    return { idx, name: s.name, isTram: s.isTram, isBus: s.isBus, tramLines: s.tramLines, busLines: s.busLines }
  }, [])

  const openStopSheet = useCallback((idx: number) => {
    setSelectedStop(buildStopInfo(idx))
    setSheetStep('main')
    requestAnimationFrame(() => setSheetVisible(true))
  }, [buildStopInfo])

  const closeSheet = useCallback(() => {
    setSheetVisible(false)
    setTimeout(() => { setSelectedStop(null); setSheetStep('main') }, 280)
  }, [])

  const closePanel = useCallback(() => {
    setPanelVisible(false)
    setTimeout(() => setPanelOpen(false), 280)
  }, [])

  const togglePanel = useCallback(() => {
    if (panelOpen) { closePanel(); return }
    setPanelOpen(true)
    requestAnimationFrame(() => setPanelVisible(true))
  }, [panelOpen, closePanel])

  const handleMapLoad = useCallback((e: any) => {
    const map = e.target
    loadIconImage(map, 'icon-tram', tramIconUrl)
    loadIconImage(map, 'icon-bus', busIconUrl)
    loadIconImage(map, 'icon-report', reportIconUrl)
    loadSvgImage(map, 'tail-tram', triangleSvg(TRAM_BORDER))
    loadSvgImage(map, 'tail-bus', triangleSvg(BUS_BORDER))
  }, [])

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) return
    openStopSheet((feature.properties as any).idx)
  }, [openStopSheet])

  const submitReport = useCallback((stopIdx: number, type: ReportType, line?: string) => {
    socket.emit('report:create', { stopIdx, type, line })
    closeSheet()
  }, [closeSheet])

  const handlePickType = useCallback((type: SheetStep) => {
    if (!selectedStop) return
    if (type === 'main') {
      submitReport(selectedStop.idx, 'arret')
      return
    }
    setSheetStep(type)
  }, [selectedStop, submitReport])

  const handlePickLine = useCallback((type: 'tram' | 'bus', line: string) => {
    if (!selectedStop) return
    submitReport(selectedStop.idx, type, line)
  }, [selectedStop, submitReport])

  const handleDeleteReport = useCallback((report: Report) => {
    socket.emit('report:delete', { stopIdx: report.stopIdx, type: report.type, line: report.line })
  }, [])

  const handleSelectFromPanel = useCallback((stopIdx: number) => {
    closePanel()
    const s = (stopsData as any[])[stopIdx]
    mapRef.current?.flyTo({ center: [s.lon, s.lat], zoom: 16 })
    setTimeout(() => openStopSheet(stopIdx), 200)
  }, [closePanel, openStopSheet])

  const activeReportsForStop = selectedStop ? reports.filter((r) => r.stopIdx === selectedStop.idx) : []

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        initialViewState={{ ...CAEN_CENTER, zoom: 13 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        interactiveLayerIds={['stop-bg']}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
      >
        <Source id="tram-lines" type="geojson" data={linesData}>
          <Layer id="tram-lines-glow" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': ['get', 'color'], 'line-width': 8, 'line-blur': 4, 'line-opacity': 0.25 }} />
          <Layer id="tram-lines-core" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.9 }} />
        </Source>

        <Source id="stops" type="geojson" data={stopsGeoJson}>
          <Layer id="stop-shadow" type="circle" minzoom={14} paint={{ 'circle-color': ['case', ['get', 'isTram'], TRAM_BORDER, BUS_BORDER], 'circle-radius': 16, 'circle-blur': 1, 'circle-opacity': 0.35 }} />
          <Layer id="stop-tail" type="symbol" minzoom={14} layout={{ 'icon-image': ['case', ['get', 'isTram'], 'tail-tram', 'tail-bus'], 'icon-size': 1, 'icon-anchor': 'top', 'icon-offset': [0, 12], 'icon-allow-overlap': true }} />
          <Layer id="stop-bg" type="circle" minzoom={14} paint={{ 'circle-color': '#ffffff', 'circle-radius': 15, 'circle-stroke-width': 3, 'circle-stroke-color': ['case', ['get', 'isTram'], TRAM_BORDER, BUS_BORDER] }} />
          <Layer id="stop-icon" type="symbol" minzoom={14} layout={{ 'icon-image': ['case', ['get', 'isTram'], 'icon-tram', 'icon-bus'], 'icon-size': ['case', ['get', 'isTram'], 0.035, 0.051], 'icon-allow-overlap': true }} />
          <Layer
            id="stop-report-badge"
            type="symbol"
            minzoom={14}
            layout={{ 'icon-image': 'icon-report', 'icon-size': 0.03, 'icon-offset': [12, 12], 'icon-allow-overlap': true }}
            filter={['get', 'hasReport']}
          />
        </Source>

        {userPos && (
          <Marker longitude={userPos.lon} latitude={userPos.lat}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#3b82f6', border: '3px solid #ffffff', boxShadow: '0 0 0 2px rgba(59,130,246,0.4)' }} />
          </Marker>
        )}
      </Map>

      {!connected && (
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, background: '#78350f', color: '#fef3c7', fontSize: 13, fontWeight: 600, padding: '10px 16px', borderRadius: 14, textAlign: 'center' }}>
          Connexion au serveur en cours...
        </div>
      )}

      {locationError && (
        <div
          style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            background: '#1f2937', color: '#ffffff', fontSize: 13, fontWeight: 600,
            padding: '12px 16px', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          }}
        >
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 18, flexShrink: 0 }}>×</button>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', right: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={togglePanel}
          className="tap"
          style={{ width: 58, height: 58, borderRadius: '50%', background: panelOpen ? '#fee2e2' : '#ffffff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={reportIconUrl} style={{ width: 28, height: 28, objectFit: 'contain' }} />
        </button>

        <button
          onClick={recenterOnUser}
          className="tap"
          style={{ width: 58, height: 58, borderRadius: '50%', background: '#ffffff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: locating ? 0.6 : 1 }}
        >
          <LocateIcon active={!!userPos} />
        </button>
      </div>

      {selectedStop && (
        <BottomSheet
          stop={selectedStop}
          visible={sheetVisible}
          step={sheetStep}
          activeReports={activeReportsForStop}
          onClose={closeSheet}
          onBack={() => setSheetStep('main')}
          onPickType={handlePickType}
          onPickLine={handlePickLine}
          onDeleteReport={handleDeleteReport}
        />
      )}

      {panelOpen && (
        <ReportsPanel visible={panelVisible} reports={reports} onClose={closePanel} onSelect={handleSelectFromPanel} />
      )}
    </div>
  )
}
