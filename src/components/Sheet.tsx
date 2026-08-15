import type { ReactNode } from 'react'

export default function Sheet({
  visible, onClose, children, maxHeight = '82dvh',
}: { visible: boolean; onClose: () => void; children: ReactNode; maxHeight?: string }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: visible ? 'blur(3px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(3px)' : 'blur(0px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.28s ease, backdrop-filter 0.28s ease',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.38s cubic-bezier(0.19,1,0.22,1)',
          background: '#0f1621', borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '10px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -14px 36px rgba(0,0,0,0.5)', maxHeight, overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#374151', borderRadius: 2, margin: '6px auto 18px' }} />
        <div key={visible ? 'v' : 'h'} className="sheet-content">
          {children}
        </div>
      </div>
    </>
  )
}
