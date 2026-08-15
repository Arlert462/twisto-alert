import { useState, useEffect, useCallback } from 'react'
import reportIconUrl from './assets/report.png'

const STORAGE_KEY = 'twisto-install-dismissed'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#3b82f6" strokeWidth="2" />
    </svg>
  )
}

function MenuDotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6" r="1.8" fill="#3b82f6" />
      <circle cx="12" cy="12" r="1.8" fill="#3b82f6" />
      <circle cx="12" cy="18" r="1.8" fill="#3b82f6" />
    </svg>
  )
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: '#151d2c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#3b82f6', fontWeight: 800, fontSize: 13, flexShrink: 0,
      }}>
        {number}
      </div>
      <div style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.4 }}>{children}</div>
    </div>
  )
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [ios] = useState(isIOS())

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(STORAGE_KEY) === '1') return

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const id = setTimeout(() => {
      setVisible(true)
      requestAnimationFrame(() => setShow(true))
    }, 1200)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(id)
    }
  }, [])

  const dismiss = useCallback(() => {
    setShow(false)
    setTimeout(() => setVisible(false), 320)
    localStorage.setItem(STORAGE_KEY, '1')
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }, [deferredPrompt, dismiss])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        onClick={dismiss}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: show ? 'blur(3px)' : 'blur(0px)', WebkitBackdropFilter: show ? 'blur(3px)' : 'blur(0px)',
          opacity: show ? 1 : 0, transition: 'opacity 0.28s ease, backdrop-filter 0.28s ease',
        }}
      />
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 360,
          background: '#0f1621', borderRadius: 26, padding: '28px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
          opacity: show ? 1 : 0,
          transition: 'transform 0.38s cubic-bezier(0.19,1,0.22,1), opacity 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <img src={reportIconUrl} style={{ width: 64, height: 64, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
        </div>

        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 19, textAlign: 'center', marginBottom: 6, letterSpacing: -0.3 }}>
          Installe Twisto Alert
        </div>
        <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 1.45 }}>
          Ajoute l'application à ton écran d'accueil pour l'ouvrir en un tap, comme une vraie appli.
        </div>

        {ios ? (
          <div style={{ marginBottom: 8 }}>
            <Step number={1}>Appuie sur l'icône <ShareIcon /> <strong style={{ color: '#ffffff' }}>Partager</strong> en bas de Safari</Step>
            <Step number={2}>Fais défiler et choisis <strong style={{ color: '#ffffff' }}>Sur l'écran d'accueil</strong></Step>
            <Step number={3}>Appuie sur <strong style={{ color: '#ffffff' }}>Ajouter</strong> en haut à droite</Step>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={install}
            className="tap"
            style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: 800, fontSize: 15, marginBottom: 12, boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
          >
            Installer maintenant
          </button>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <Step number={1}>Appuie sur le menu <MenuDotsIcon /> en haut à droite de Chrome</Step>
            <Step number={2}>Choisis <strong style={{ color: '#ffffff' }}>Installer l'application</strong></Step>
          </div>
        )}

        <button onClick={dismiss} className="tap" style={{ width: '100%', padding: '13px', marginTop: 10, borderRadius: 14, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 700 }}>
          Plus tard
        </button>
      </div>
    </div>
  )
}
