import type { StopInfo, Report, SheetStep } from '../types'
import { BackIcon } from './Icons'
import { SignalButton, LinePillButton, LineBadgeRow, ActiveReportRow } from './UIBits'
import Sheet from './Sheet'
import tramIconUrl from '../assets/tram.png'
import busIconUrl from '../assets/bus.png'

const TRAM_BORDER = '#a855f7'
const BUS_BORDER = '#f97316'
const ARRET_COLOR = '#3b82f6'

export default function BottomSheet({
  stop, visible, step, activeReports, onClose, onBack, onPickType, onPickLine, onDeleteReport,
}: {
  stop: StopInfo
  visible: boolean
  step: SheetStep
  activeReports: Report[]
  onClose: () => void
  onBack: () => void
  onPickType: (type: SheetStep) => void
  onPickLine: (type: 'tram' | 'bus', line: string) => void
  onDeleteReport: (report: Report) => void
}) {
  const lineList = step === 'select-tram' ? stop.tramLines : step === 'select-bus' ? stop.busLines : []

  return (
    <Sheet visible={visible} onClose={onClose}>
      {step !== 'main' && (
        <button onClick={onBack} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#9ca3af', fontWeight: 600, fontSize: 14, marginBottom: 10, padding: 0 }}>
          <BackIcon /> Retour
        </button>
      )}

      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 21, letterSpacing: -0.4 }}>{stop.name}</div>

      {step === 'main' && (
        <>
          <div style={{ color: '#6b7280', fontWeight: 600, fontSize: 13, marginTop: 3, marginBottom: 18 }}>
            {stop.isTram && stop.isBus ? 'Arrêt Tramway & Bus' : stop.isTram ? 'Arrêt Tramway' : 'Arrêt Bus'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            <LineBadgeRow lines={stop.tramLines} />
            <LineBadgeRow lines={stop.busLines} />
          </div>

          {activeReports.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {activeReports.map((r) => (
                <ActiveReportRow key={r.key} report={r} onDelete={() => onDeleteReport(r)} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stop.isTram && (
              <SignalButton iconUrl={tramIconUrl} color={TRAM_BORDER} label="Signaler des contrôleurs dans le tram" onClick={() => onPickType('select-tram')} />
            )}
            {stop.isBus && (
              <SignalButton iconUrl={busIconUrl} color={BUS_BORDER} label="Signaler des contrôleurs dans le bus" onClick={() => onPickType('select-bus')} />
            )}
            <SignalButton color={ARRET_COLOR} label="Signaler des contrôleurs sur l'arrêt" onClick={() => onPickType('main')} />
          </div>
        </>
      )}

      {(step === 'select-tram' || step === 'select-bus') && (
        <>
          <div style={{ color: '#6b7280', fontWeight: 600, fontSize: 13, marginTop: 3, marginBottom: 20 }}>
            Sur quelle ligne se trouvent les contrôleurs ?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lineList.map((l) => (
              <LinePillButton key={l.name} badge={l} onClick={() => onPickLine(step === 'select-tram' ? 'tram' : 'bus', l.name)} />
            ))}
          </div>
        </>
      )}

      <button onClick={onClose} className="tap" style={{ width: '100%', padding: '13px', marginTop: 16, borderRadius: 14, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 700 }}>
        Annuler
      </button>
    </Sheet>
  )
}
