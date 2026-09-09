'use client'

import { useState, useRef, useEffect } from 'react'
import {
  AlertCircle,
  Check,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
  Camera,
  Loader2,
} from 'lucide-react'
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { ADMIN_CONTACT, type Assignment } from '@/lib/library-data'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { getAdminProfile, saveAdminProfile, uploadAdminPhoto, deleteAdminPhoto, type AdminProfile } from '@/lib/admin-profile'
import pkg from '../../package.json'

type SettingsSection = 'profile' | 'security' | 'about'

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export default function SettingsPage({
  role,
  student,
  onLogout,
  adminProfile: initialAdminProfile,
  onProfileUpdate,
}: {
  role: 'admin' | 'student'
  student?: Assignment
  onLogout: () => void
  adminProfile?: AdminProfile
  onProfileUpdate?: (patch: Partial<AdminProfile>) => void
}) {
  const [section, setSection] = useState<SettingsSection>('profile')
  const [signingOut, setSigningOut] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(initialAdminProfile ?? null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(initialAdminProfile?.displayName || 'Admin')
  const [phone, setPhone] = useState(initialAdminProfile?.phone || '')
  const [email, setEmail] = useState(initialAdminProfile?.email || 'admin@klbookhouse.in')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    if (initialAdminProfile) {
      setAdminProfile(initialAdminProfile)
      setDisplayName(initialAdminProfile.displayName || 'Admin')
      setPhone(initialAdminProfile.phone || '')
      setEmail(initialAdminProfile.email || 'admin@klbookhouse.in')
    }
  }, [initialAdminProfile])

  const displayNameFinal = role === 'admin' ? (adminProfile?.displayName || 'Admin') : (student?.studentName ?? 'Member')

  const handleLogout = async () => {
    setSigningOut(true)
    setNotice(null)
    try {
      if (auth) await signOut(auth)
      onLogout()
    } catch (error) {
      console.error('Logout failed:', error)
      setNotice({ type: 'error', text: 'Could not sign out. Please try again.' })
      setSigningOut(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', text: 'Please select an image file.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Image must be smaller than 5 MB.' })
      return
    }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setProfilePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setProfilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setNotice(null)
    try {
      let photoURL = adminProfile?.photoURL || ''
      if (photoFile) {
        photoURL = await uploadAdminPhoto(photoFile)
      } else if (profilePreview === null && adminProfile?.photoURL) {
        await deleteAdminPhoto()
        photoURL = ''
      }
      const profileData: Partial<AdminProfile> = {
        displayName: displayName.trim() || 'Admin',
        email: email.trim(),
        phone: phone.trim(),
        photoURL,
      }
      await saveAdminProfile(profileData)
      const fullProfile: AdminProfile = {
        displayName: displayName.trim() || 'Admin',
        email: email.trim(),
        phone: phone.trim(),
        photoURL,
      }
      setAdminProfile(fullProfile)
      onProfileUpdate?.(fullProfile)
      setNotice({ type: 'success', text: 'Profile updated successfully.' })
      setPhotoFile(null)
      setProfilePreview(null)
    } catch (error) {
      console.error('Failed to save profile:', error)
      setNotice({ type: 'error', text: 'Could not save profile. Please try again.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (!auth || !auth.currentUser) {
      setPasswordError('You must be signed in to change your password.')
      return
    }
    setChangingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email || email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setPasswordSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Password change failed:', error)
      setPasswordError('Could not update password. Please check your current password and try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const navItem = (key: SettingsSection, label: string, icon: React.ReactNode, desc: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setSection(key)}
      aria-current={section === key ? 'page' : undefined}
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 text-left text-sm sidebar-link',
        'pressable',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        section === key
          ? 'bg-primary/10 font-semibold text-primary'
          : 'text-muted-foreground',
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block">{label}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{desc}</span>
      </span>
    </button>
  )

  const sectionNav = (
    <nav aria-label="Settings sections" className="flex flex-col gap-1.5">
      {navItem('profile', 'Profile', <User className="size-4" aria-hidden="true" />, 'Account details')}
      {navItem('security', 'Security', <ShieldCheck className="size-4" aria-hidden="true" />, 'Sign-in & access')}
      {navItem('about', 'About', <Info className="size-4" aria-hidden="true" />, 'App & support info')}
    </nav>
  )

  const inputClasses = cn(
    'mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm',
    'outline-none transition duration-150 focus:border-primary focus:ring-4 focus:ring-primary/10',
  )

  return (
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        <div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account, security and preferences.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className={cn(
              'mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm',
              notice.type === 'success'
                ? 'bg-success-subtle text-success'
                : 'bg-danger-subtle text-destructive',
            )}
          >
            {notice.type === 'success' ? (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1">{notice.text}</span>
            <button
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
              className="grid size-6 place-items-center rounded-lg hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
              {sectionNav}
            </div>
          </div>

          <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-muted p-1">
              {[
                { key: 'profile' as const, label: 'Profile', icon: <User className="size-4" aria-hidden="true" /> },
                { key: 'security' as const, label: 'Security', icon: <ShieldCheck className="size-4" aria-hidden="true" /> },
                { key: 'about' as const, label: 'About', icon: <Info className="size-4" aria-hidden="true" /> },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  aria-current={section === item.key ? 'page' : undefined}
                  className={cn(
                    'flex min-w-[110px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition duration-150',
                    'pressable',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    section === item.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0" key={section}>
            {section === 'profile' && (
              <div className="settings-fade flex flex-col gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                    <div className="relative">
                      {profilePreview || adminProfile?.photoURL ? (
                        <img
                          src={profilePreview || adminProfile?.photoURL}
                          alt={displayName}
                          className="size-20 rounded-full object-cover ring-4 ring-primary/10"
                        />
                      ) : (
                        <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xl font-bold text-primary-foreground ring-4 ring-primary/10" aria-hidden="true">
                          {initials(displayName)}
                        </div>
                      )}
                      <button
                        onClick={handlePhotoClick}
                        aria-label="Change profile picture"
                        className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition duration-150 hover:brightness-110 active:scale-95"
                      >
                        <Camera className="size-3.5" aria-hidden="true" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        aria-label="Upload profile picture"
                      />
                    </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="font-serif text-2xl font-bold">{displayName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {role === 'admin' ? 'Administrator' : 'Library member'}
                        </p>
                        {role === 'admin' && (
                          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <button
                              onClick={handlePhotoClick}
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              Change photo
                            </button>
                            {(adminProfile?.photoURL || profilePreview) && (
                              <button
                                onClick={handleRemovePhoto}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-destructive transition duration-150 hover:bg-destructive/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                  </div>

                  <dl className="mt-6 flex flex-col gap-4 border-t border-border pt-6 text-sm">
                    {role === 'admin' ? (
                      <>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <User className="size-4" aria-hidden="true" />
                            Display name
                          </dt>
                          <dd className="flex-1 sm:max-w-xs">
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className={cn(inputClasses, 'mt-0')}
                              aria-label="Display name"
                            />
                          </dd>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="size-4" aria-hidden="true" />
                            Email address
                          </dt>
                          <dd className="flex-1 sm:max-w-xs">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={cn(inputClasses, 'mt-0')}
                              aria-label="Email address"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">Used for sign-in and notifications.</p>
                          </dd>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="size-4" aria-hidden="true" />
                            Phone number
                          </dt>
                          <dd className="flex-1 sm:max-w-xs">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className={cn(inputClasses, 'mt-0')}
                              aria-label="Phone number"
                            />
                          </dd>
                        </div>
                      </>
                    ) : (
                      <>
                        {student?.billNo && (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <dt className="text-muted-foreground">Bill number</dt>
                            <dd className="font-semibold">{student.billNo}</dd>
                          </div>
                        )}
                        {student?.seatNo && (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <dt className="text-muted-foreground">Seat</dt>
                            <dd className="font-semibold">Seat {student.seatNo}</dd>
                          </div>
                        )}
                        {student?.mobileNo && (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <dt className="text-muted-foreground">Mobile number</dt>
                            <dd className="font-semibold">{student.mobileNo}</dd>
                          </div>
                        )}
                      </>
                    )}
                  </dl>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    {role === 'admin' && (
                      <button
                        onClick={() => void handleSaveProfile()}
                        disabled={savingProfile}
                        className={cn(
                          'h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground',
                          'transition duration-150 hover:brightness-110 active:scale-[0.98]',
                          'disabled:cursor-not-allowed disabled:opacity-60',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        )}
                      >
                        {savingProfile ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            Saving...
                          </span>
                        ) : (
                          'Save changes'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {section === 'security' && (
              <div className="settings-fade flex flex-col gap-6">
                {role === 'admin' && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                          Change password
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Update your password to keep your account secure.
                        </p>
                      </div>
                    </div>

                  <div className="mt-6 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="current-password">
                        Current password
                      </label>
                      <input
                        id="current-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-password">
                        New password
                      </label>
                      <input
                        id="new-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="confirm-password">
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        {showPasswords ? 'Hide passwords' : 'Show passwords'}
                      </button>
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 rounded-xl bg-danger-subtle px-3 py-2.5 text-sm text-destructive" role="alert">
                        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 rounded-xl bg-success-subtle px-3 py-2.5 text-sm text-success" role="status">
                        <Check className="size-4 shrink-0" aria-hidden="true" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    <button
                      onClick={() => void handleChangePassword()}
                      disabled={changingPassword}
                      className={cn(
                        'h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground',
                        'transition duration-150 hover:brightness-110 active:scale-[0.98]',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      )}
                    >
                      {changingPassword ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Updating...
                        </span>
                      ) : (
                        'Update password'
                      )}
                    </button>
                  </div>
                </div>
              )}

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-bold">Sign out</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Sign out of this device when you are finished to keep your account secure.
                  </p>
                  <button
                    onClick={() => void handleLogout()}
                    disabled={signingOut}
                    className={cn(
                      'mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive',
                      'transition duration-150 hover:bg-destructive/5',
                      'disabled:opacity-60',
                      'pressable',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    {signingOut ? 'Signing out...' : 'Sign out of account'}
                  </button>
                </div>
              </div>
            )}

            {section === 'about' && (
              <div className="settings-fade flex flex-col gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                    <Info className="size-5 text-primary" aria-hidden="true" />
                    About KL Book House
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A library management system for tracking seats, shifts, students, attendance and payments — built for the team that keeps KL Book House running.
                  </p>
                  <dl className="mt-5 flex flex-col gap-3 rounded-xl bg-muted p-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Application</dt>
                      <dd className="font-semibold">KL Book House</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Version</dt>
                      <dd className="font-semibold">{pkg?.version || '1.0.0'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Data</dt>
                      <dd className="font-semibold">Cloud Firestore</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Auth</dt>
                      <dd className="font-semibold">Firebase Authentication</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                    <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                    Library support
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {ADMIN_CONTACT.hours} &middot; {ADMIN_CONTACT.email}
                  </p>
                  <a
                    href={`tel:${ADMIN_CONTACT.phone}`}
                    className={cn(
                      'mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground',
                      'transition duration-150 hover:brightness-110',
                      'pressable',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {ADMIN_CONTACT.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
