import { collection, getDocs } from 'firebase/firestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { db } from './firebase'
import type { Assignment } from './library-data'

/**
 * Maps a raw Firestore "assignments" doc into the typed Assignment shape.
 */
export function mapAssignmentDoc(
  snapshotDoc: QueryDocumentSnapshot<DocumentData>,
): Assignment {
  const docData = snapshotDoc.data()

  return {
    id: snapshotDoc.id,
    seatNo: docData.seatNo || '',
    studentName: docData.studentName || '',
    billNo: docData.billNo || '',
    shiftIds: docData.shiftIds || [],
    admissionDate: docData.admissionDate || '',
    expiryDate: docData.expiryDate || '',
    mobileNo: docData.mobileNo || '',
    dueStatus: docData.dueStatus || 'paid',
    amountPaid: docData.amountPaid ?? 0,
    amountDue: docData.amountDue ?? 0,
    paymentMode: docData.paymentMode || undefined,
  } as Assignment
}

// ---------------------------------------------------------------------------
// In-memory client cache.
//
// Seeding views from this cache lets already-visited pages render instantly on
// navigation (no skeleton flash) while a fresh background fetch keeps the data
// correct. It is cleared entirely on sign-out so the next session still shows
// genuine first-load skeletons.
// ---------------------------------------------------------------------------

let assignmentsCache: Assignment[] | null = null
const attendanceCache = new Map<string, Record<string, boolean>>()
let assignmentsInflight: Promise<Assignment[] | null> | null = null

export function getCachedAssignments(): Assignment[] | null {
  return assignmentsCache
}

export function setCachedAssignments(list: Assignment[]): void {
  assignmentsCache = list
}

/**
 * Fetches all assignments exactly once per in-flight request (dedupes the
 * concurrent reads across views) and stores the result in the cache.
 */
export function getAssignments(): Promise<Assignment[] | null> {
  if (!db) return Promise.resolve(null)
  if (assignmentsInflight) return assignmentsInflight

  assignmentsInflight = getDocs(collection(db, 'assignments'))
    .then((snapshot) => {
      const list = snapshot.docs.map(mapAssignmentDoc)
      assignmentsCache = list
      return list
    })
    .catch((error) => {
      // Keep the last-known-good cache on failure; the caller surfaces the error.
      throw error
    })
    .finally(() => {
      assignmentsInflight = null
    })
  return assignmentsInflight
}

export function getCachedAttendance(
  key: string,
): Record<string, boolean> | null {
  return attendanceCache.get(key) ?? null
}

export function setCachedAttendance(
  key: string,
  map: Record<string, boolean>,
): void {
  attendanceCache.set(key, map)
}

export function clearClientCache(): void {
  assignmentsCache = null
  assignmentsInflight = null
  attendanceCache.clear()
}