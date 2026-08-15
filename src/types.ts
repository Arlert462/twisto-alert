export type LineBadge = { name: string; color: string }

export type StopInfo = {
  idx: number
  name: string
  isTram: boolean
  isBus: boolean
  tramLines: LineBadge[]
  busLines: LineBadge[]
}

export type ReportType = 'tram' | 'bus' | 'arret'

export type Report = {
  key: string
  stopIdx: number
  type: ReportType
  line?: string
  ts: number
  confirmations: number
}

export type SheetStep = 'main' | 'select-tram' | 'select-bus'
