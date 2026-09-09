export function toDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function toInputDate(dateStr: string): string {
  return dateStr
}

export function formatDate(dateStr: string): string {
  return toDisplayDate(dateStr)
}

export function parseDate(dateStr: string): Date | null {
  const [d, m, y] = dateStr.split('/').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}

export function isDateValid(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function admissionBeforeExpiry(admission: string, expiry: string): boolean {
  if (!admission || !expiry) return true
  const [ay, am, ad] = admission.split('-').map(Number)
  const [ey, em, ed] = expiry.split('-').map(Number)
  if (!ay || !am || !ad || !ey || !em || !ed) return true
  const adm = new Date(ay, am - 1, ad)
  const exp = new Date(ey, em - 1, ed)
  return adm <= exp
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const ny = date.getFullYear()
  const nm = String(date.getMonth() + 1).padStart(2, '0')
  const nd = String(date.getDate()).padStart(2, '0')
  return `${ny}-${nm}-${nd}`
}

export function calculateExpiryDate(admissionDate: string): string {
  if (!admissionDate) return ''
  return addDays(admissionDate, 30)
}
