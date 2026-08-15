export function LocateIcon({ active }: { active: boolean }) {
  const color = active ? '#3b82f6' : '#1f2937'
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <line x1="12" y1="1" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="4" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" fill="#3b82f6" />
      <circle cx="12" cy="10" r="3" fill="#ffffff" />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
