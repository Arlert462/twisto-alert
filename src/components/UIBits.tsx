import type { LineBadge, Report } from '../types'
import { PinIcon } from './Icons'
import { timeAgo, formatTime } from '../mapHelpers'
import reportIconUrl from '../assets/report.png'

export function SignalButton({
  iconUrl, color, label, onClick,
}: { iconUrl?: string; color: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#151d2c', border: 'none',
        borderRadius: 18, padding: '13px 18px',
        color: '#ffffff', fontWeight: 700, fontSize: 15, textAlign: 'left', width: '100%',
      }}
    >
      <span style={{
        width: 42, height: 42, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: `0 3px 10px ${color}55`,
      }}>
        {iconUrl
          ? <img src={iconUrl} style={{ width: 22, height: 22, objectFit: 'contain' }} />
          : <PinIcon />}
      </span>
      {label}
    </button>
  )
}

export function LinePillButton({ badge, onClick }: { badge: LineBadge; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap"
      style={{
        background: badge.color, color: '#ffffff', fontWeight: 800, fontSize: 16,
        padding: '15px 0', borderRadius: 40, border: 'none', width: '100%',
        boxShadow: `0 4px 14px ${badge.color}66`,
      }}
    >
      {badge.name}
    </button>
  )
}

export function LineBadgeRow({ lines }: { lines: LineBadge[] }) {
  return (
    <>
      {lines.map((l) => (
        <span
          key={l.name}
          style={{
            background: l.color, color: '#ffffff', fontWeight: 800, fontSize: 14,
            padding: '7px 16px', borderRadius: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {l.name}
        </span>
      ))}
    </>
  )
}

export function ReportPill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          background: color, color: '#ffffff', fontWeight: 800, fontSize: 14,
          padding: '8px 18px', borderRadius: 20, display: 'inline-block',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}
      >
        {label}
      </span>
      <img
        src={reportIconUrl}
        style={{
          position: 'absolute', bottom: -6, right: -6, width: 20, height: 20,
          background: '#0f1621', borderRadius: '50%', padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </span>
  )
}

export function ActiveReportRow({ report, onDelete }: { report: Report; onDelete: () => void }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.5)',
        borderRadius: 18, padding: '11px 14px', marginBottom: 10,
      }}
    >
      <div>
        <div style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>
          {report.type === 'arret' ? "Signalé sur l'arrêt" : `Signalé — ${report.line}`}
        </div>
        <div style={{ color: '#9c6b6b', fontSize: 12, marginTop: 3 }}>
          {formatTime(report.ts)} · {timeAgo(report.ts)}{report.confirmations > 1 ? ` · confirmé ${report.confirmations}×` : ''}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="tap"
        style={{
          background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 12,
          padding: '9px 14px', fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}
      >
        Supprimer
      </button>
    </div>
  )
}
