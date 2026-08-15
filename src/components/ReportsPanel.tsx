import type { Report, LineBadge } from '../types'
import { ReportPill } from './UIBits'
import { timeAgo, formatTime } from '../mapHelpers'
import Sheet from './Sheet'
import stopsData from '../data/stops.json'

const TRAM_BORDER = '#a855f7'
const BUS_BORDER = '#f97316'
const ARRET_COLOR = '#3b82f6'

export default function ReportsPanel({
  visible, reports, onClose, onSelect,
}: { visible: boolean; reports: Report[]; onClose: () => void; onSelect: (stopIdx: number) => void }) {
  const sorted = [...reports].sort((a, b) => b.ts - a.ts)

  return (
    <Sheet visible={visible} onClose={onClose}>
      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 21, letterSpacing: -0.4 }}>Signalements actifs</div>
      <div style={{ color: '#6b7280', fontWeight: 600, fontSize: 13, marginTop: 3, marginBottom: 20 }}>
        {sorted.length === 0 ? 'Aucun signalement pour le moment' : `${sorted.length} en ce moment sur le réseau`}
      </div>

      {sorted.length === 0 && (
        <div style={{ color: '#4b5563', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          Tout est calme pour l'instant.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((r) => {
          const stop = (stopsData as any[])[r.stopIdx]
          const color = r.type === 'tram'
            ? (stop.tramLines.find((l: LineBadge) => l.name === r.line)?.color || TRAM_BORDER)
            : r.type === 'bus'
              ? (stop.busLines.find((l: LineBadge) => l.name === r.line)?.color || BUS_BORDER)
              : ARRET_COLOR
          const label = r.type === 'arret' ? 'Arrêt' : r.line || ''
          return (
            <button
              key={r.key}
              onClick={() => onSelect(r.stopIdx)}
              className="tap"
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#151d2c', border: 'none', borderRadius: 18, padding: '13px 16px', width: '100%', textAlign: 'left' }}
            >
              <ReportPill label={label} color={color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.name}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                  {formatTime(r.ts)} · {timeAgo(r.ts)}{r.confirmations > 1 ? ` · confirmé ${r.confirmations}×` : ''}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button onClick={onClose} className="tap" style={{ width: '100%', padding: '13px', marginTop: 18, borderRadius: 14, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 700 }}>
        Fermer
      </button>
    </Sheet>
  )
}
