export const SHIFTS = [
  { id: 'morning', name: 'Morning', time: '6:00 — 10:00', short: '06–10' },
  { id: 'midday', name: 'Midday', time: '10:00 — 14:00', short: '10–14' },
  { id: 'afternoon', name: 'Afternoon', time: '14:00 — 18:00', short: '14–18' },
  { id: 'evening', name: 'Evening', time: '18:00 — 22:00', short: '18–22' },
]

export const DEMO_ASSIGNMENTS = [
  { seatNo: 'A-01', studentName: 'Aarav Mehta', billNo: 'KL-1048', shiftId: 'morning', admissionDate: '2026-01-05', expiryDate: '2026-07-18', mobileNo: '+91 98765 43210', amountDue: 0, dueStatus: 'paid' },
  { seatNo: 'A-02', studentName: 'Diya Sharma', billNo: 'KL-1052', shiftId: 'morning', admissionDate: '2026-02-10', expiryDate: '2026-08-14', mobileNo: '+91 99887 77665', amountDue: 0, dueStatus: 'paid' },
  { seatNo: 'A-04', studentName: 'Rohan Gupta', billNo: 'KL-1061', shiftId: 'midday', admissionDate: '2026-03-02', expiryDate: '2026-06-28', mobileNo: '+91 98111 22334', amountDue: 500, dueStatus: 'partial' },
  { seatNo: 'A-06', studentName: 'Meera Nair', billNo: 'KL-1070', shiftId: 'afternoon', admissionDate: '2026-02-17', expiryDate: '2026-06-12', mobileNo: '+91 97654 32109', amountDue: 1200, dueStatus: 'due' },
  { seatNo: 'B-01', studentName: 'Kabir Singh', billNo: 'KL-1084', shiftId: 'evening', admissionDate: '2026-04-01', expiryDate: '2026-09-30', mobileNo: '+91 98989 11223', amountDue: 0, dueStatus: 'paid' },
  { seatNo: 'B-03', studentName: 'Ananya Rao', billNo: 'KL-1090', shiftId: 'morning', admissionDate: '2026-03-20', expiryDate: '2026-06-15', mobileNo: '+91 90000 11223', amountDue: 0, dueStatus: 'paid' },
  { seatNo: 'B-05', studentName: 'Vikram Joshi', billNo: 'KL-1097', shiftId: 'midday', admissionDate: '2026-01-19', expiryDate: '2026-06-20', mobileNo: '+91 95555 66778', amountDue: 800, dueStatus: 'due' },
  { seatNo: 'C-02', studentName: 'Ishita Kapoor', billNo: 'KL-1102', shiftId: 'afternoon', admissionDate: '2026-05-01', expiryDate: '2026-10-31', mobileNo: '+91 94444 33221', amountDue: 0, dueStatus: 'paid' },
  { seatNo: 'C-04', studentName: 'Arjun Patel', billNo: 'KL-1106', shiftId: 'evening', admissionDate: '2026-02-25', expiryDate: '2026-07-02', mobileNo: '+91 93333 22110', amountDue: 0, dueStatus: 'paid' },
]

export const SEATS = Array.from({ length: 57 }, (_, index) => ({
  seatNo: `${String.fromCharCode(65 + Math.floor(index / 6))}-${String((index % 6) + 1).padStart(2, '0')}`,
  row: String.fromCharCode(65 + Math.floor(index / 6)),
  number: (index % 6) + 1,
}))

export const ADMIN_CONTACT = { name: 'Library Desk', phone: '+91 00000 00000', email: 'klbookhouse@example.com', hours: '06:00 — 22:00 daily' }

export function getAssignment(seatNo: string, shiftId: string) {
  return DEMO_ASSIGNMENTS.find(item => item.seatNo === seatNo && item.shiftId === shiftId)
}

export function getExpiryLabel(date: string) {
  const days = Math.ceil((new Date(date).getTime() - new Date('2026-06-08').getTime()) / 86400000)
  if (days < 0) return 'Expired'
  if (days <= 14) return `${days} days left`
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function getExpiryTone(date: string) {
  const days = Math.ceil((new Date(date).getTime() - new Date('2026-06-08').getTime()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 14) return 'soon'
  return 'active'
}

export function getFirebaseSetup() {
  return { auth: 'Firebase Auth', roles: 'Firestore users/{uid}.role', data: 'Firestore assignments collection' }
}

export type Assignment = typeof DEMO_ASSIGNMENTS[number]
export type Shift = typeof SHIFTS[number]
export type Role = 'admin' | 'student'
export type ViewMode = 'login' | 'admin' | 'student'

export const MODEL_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kl_boox_house_5-VCuxVPe0xoBkmlJZoe5pbrLhEMtaMO.glb'
export const MODEL_LOCAL_URL = '/models/kl_boox_house_5.glb'
export const SEAT_COORDS = SEATS.map((seat, index) => ({ ...seat, x: 13 + (index % 6) * 12, y: 19 + Math.floor(index / 6) * 19 }))

