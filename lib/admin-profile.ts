import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'

export interface AdminProfile {
  displayName: string
  email: string
  phone?: string
  photoURL?: string
}

const ADMIN_PROFILE_DOC = 'adminProfiles/primary'

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(db, ADMIN_PROFILE_DOC))
  if (!snap.exists()) return null
  return snap.data() as AdminProfile
}

export async function saveAdminProfile(profile: Partial<AdminProfile>): Promise<void> {
  await setDoc(doc(db, ADMIN_PROFILE_DOC), profile, { merge: true })
}

export async function uploadAdminPhoto(file: File): Promise<string> {
  const storageRef = ref(storage, `admin/profile.jpg`)
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)
  await saveAdminProfile({ photoURL: url })
  return url
}

export async function deleteAdminPhoto(): Promise<void> {
  const storageRef = ref(storage, `admin/profile.jpg`)
  try {
    await deleteObject(storageRef)
  } catch {
    // ignore if file doesn't exist
  }
  await saveAdminProfile({ photoURL: '' })
}
