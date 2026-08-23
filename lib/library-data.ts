export const SHIFTS = [
  {
    id: 'morning',
    name: 'Morning',
    time: '6:00 — 10:00',
    short: '06–10',
  },
  {
    id: 'midday',
    name: 'Midday',
    time: '10:00 — 14:00',
    short: '10–14',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    time: '14:00 — 18:00',
    short: '14–18',
  },
  {
    id: 'evening',
    name: 'Evening',
    time: '18:00 — 22:00',
    short: '18–22',
  },
] as const

// 57 physical library seats
export const SEATS = Array.from({ length: 57 }, (_, index) => ({
  seatNo: `${String.fromCharCode(65 + Math.floor(index / 6))}-${String(
    (index % 6) + 1
  ).padStart(2, '0')}`,
  row: String.fromCharCode(65 + Math.floor(index / 6)),
  number: (index % 6) + 1,
}))

// Library contact information
export const ADMIN_CONTACT = {
  name: 'Library Desk',
  phone: '+91 00000 00000',
  email: 'klbookhouse@example.com',
  hours: '06:00 — 22:00 daily',
}

// Assignment structure used by Firestore
export type Assignment = {
  id?: string
  seatNo: string
  studentName: string
  billNo: string
  shiftIds: string[] // Changed from shiftId to shiftIds (array)
  admissionDate: string
  expiryDate: string
  mobileNo: string
  // Payment tracking fields
  dueStatus: 'paid' | 'partial' | 'due'
  amountPaid: number
  amountDue: number
}

export type Shift = (typeof SHIFTS)[number]

// Admin and student logins are supported
export type Role = 'admin' | 'student'

// Application views
export type ViewMode = 'login' | 'admin' | 'student'

// Firebase configuration information
export function getFirebaseSetup() {
  return {
    auth: 'Firebase Authentication',
    data: 'Firestore assignments collection',
  }
}

// 3D library model
export const MODEL_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kl_boox_house_5-VCuxVPe0xoBkmlJZoe5pbrLhEMtaMO.glb'

export const MODEL_LOCAL_URL = '/models/kl_boox_house_5.glb'

// Coordinates for the 57 seats in the 3D/library layout
export const SEAT_COORDS = SEATS.map((seat, index) => ({
  ...seat,
  x: 13 + (index % 6) * 12,
  y: 19 + Math.floor(index / 6) * 19,
}))

// Get a readable expiry label
export function getExpiryLabel(date: string) {
  const today = new Date()
  const expiryDate = new Date(date)

  const days = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / 86400000
  )

  if (days < 0) {
    return 'Expired'
  }

  if (days <= 14) {
    return `${days} days left`
  }

  return expiryDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

// Get expiry status/tone
export function getExpiryTone(date: string) {
  const today = new Date()
  const expiryDate = new Date(date)

  const days = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / 86400000
  )

  if (days < 0) {
    return 'expired'
  }

  if (days <= 14) {
    return 'soon'
  }

  return 'active'

  
}