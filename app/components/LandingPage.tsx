'use client'

import Image from 'next/image'
import {
  BookOpen,
  CalendarDays,
  Camera,
  Clock3,
  DoorClosed,
  GraduationCap,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  Snowflake,
  Star,
  Users,
  UsersRound,
} from 'lucide-react'
import type { Role } from '@/lib/library-data'
import { Logo } from './DashboardShared'
import { cn } from '@/lib/utils'

/**
 * lucide-react v1 dropped brand/logo icons (Instagram, Facebook, etc.)
 * for trademark reasons, so we render the glyph as inline SVG instead.
 */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

/**
 * Public landing page for KL Boox House Library.
 *
 * Uses the same design tokens as Login.tsx (bg-background, text-primary,
 * font-serif, card/border utilities) so the two screens feel identical.
 *
 * Drop the five photos from "public-images/library/" into this project's
 * `public/images/library/` directory before shipping — the <Image> tags
 * below point at those paths.
 */
export function LandingPage({
  onSelectRole = () => {},
}: {
  onSelectRole?: (role: Role) => void
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_10%,hsl(var(--accent)/.7),transparent_38%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-6 py-5 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="#home">
            <Logo />
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#home"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-block"
            >
              Dashboard
            </a>

            <button
              type="button"
              onClick={() => onSelectRole('admin')}
              className={cn(
                'rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-semibold text-foreground',
                'transition duration-150 hover:border-primary/40 hover:bg-card',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              Admin login
            </button>

            <button
              type="button"
              onClick={() => onSelectRole('student')}
              className={cn(
                'rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground',
                'shadow-lg shadow-primary/20 transition duration-150 hover:brightness-110 active:scale-[0.98]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              Student login
            </button>
          </nav>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section id="home" className="mx-auto max-w-6xl px-6 pb-20 pt-14 lg:px-12 sm:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Open since July 2023
            </p>

            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              A quiet place to{' '}
              <span className="text-primary">get your studying done.</span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
              KL Boox House gives every student their own partitioned desk,
              a calm air-conditioned room, and the kind of quiet that makes
              long study sessions actually work. Over 4,500 students have
              studied here so far.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSelectRole('student')}
                className={cn(
                  'rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground',
                  'shadow-lg shadow-primary/20 transition duration-150 hover:brightness-110 active:scale-[0.98]',
                )}
              >
                Student login
              </button>
              <a
                href="#contact"
                className="rounded-xl border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-card"
              >
                Visit us
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="size-4 text-primary" aria-hidden="true" />
                57 seats
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                4 daily shifts
              </span>
              <span className="flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                4,500+ students
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Secure access
              </span>
            </div>
          </div>

          {/* Photo card, styled like the sign-in card on the login screen */}
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-border/70 bg-card p-4 shadow-2xl shadow-primary/5">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/library/entrance-signage.jpg"
                alt="KL Boox House Library entrance signage"
                fill
                sizes="(min-width: 1024px) 380px, 90vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex items-center justify-between px-1 pb-1 pt-4">
              <span className="font-serif text-sm font-semibold text-foreground">
                KL Boox House
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <CalendarDays className="size-3" aria-hidden="true" />
                Est. 2023
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Amenities ---------- */}
      <section id="amenities" className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-12">
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            Built for a full day of studying
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Everything here is arranged around one goal: letting you sit down
            and stay focused.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: DoorClosed,
                title: 'Private study cabins',
                body: 'Individually partitioned desks with your own reading light, so the person next to you never breaks your focus.',
              },
              {
                icon: UsersRound,
                title: 'Separate washrooms',
                body: 'Dedicated washrooms for girls and boys, kept clean and easy to reach from every room.',
              },
              {
                icon: Newspaper,
                title: 'Daily newspapers',
                body: 'A newspaper corner for current-affairs reading and exam prep, refreshed every day.',
              },
              {
                icon: Snowflake,
                title: 'Air-conditioned rooms',
                body: 'Every study room is air-conditioned, so peak summer afternoons stay comfortable.',
              },
              {
                icon: Camera,
                title: 'CCTV-secured premises',
                body: 'The building is monitored round the clock, so parents and students can both feel at ease.',
              },
              {
                icon: BookOpen,
                title: '4 flexible shifts',
                body: 'Morning, day, evening, and night shifts, so you can pick the hours that fit your routine.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
              >
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-serif text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Gallery ---------- */}
      <section id="gallery" className="mx-auto max-w-6xl px-6 py-16 lg:px-12">
        <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Inside the library
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          A look at the study cabins, the corridor, and the front desk.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { src: '/images/library/study-cabins-1.jpg', alt: 'Partitioned study cabins with reading lights' },
            { src: '/images/library/study-cabins-2.jpg', alt: 'Row of individual study desks' },
            { src: '/images/library/corridor.jpg', alt: 'Corridor leading to the study rooms' },
            { src: '/images/library/reception-desk.jpg', alt: 'Front desk and reception area' },
            { src: '/images/library/entrance-signage.jpg', alt: 'KL Boox House Library entrance' },
          ].map(({ src, alt }, i) => (
            <div
              key={src}
              className={cn(
                'relative overflow-hidden rounded-xl border border-border/70',
                i === 0 && 'col-span-2 row-span-2 sm:col-span-2',
              )}
            >
              <div className={cn('relative w-full', i === 0 ? 'aspect-square' : 'aspect-[4/3]')}>
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition duration-300 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:px-12">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              Visit or get in touch
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              For seat availability, fees, or a walk-through of the library,
              reach out to the admin directly.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                Shailesh Kumar Sinha — Admin
              </div>

              <a
                href="tel:+917979031015"
                className="flex items-center gap-3 text-sm text-foreground transition hover:text-primary"
              >
                <Phone className="size-4 text-primary" aria-hidden="true" />
                +91 79790 31015
              </a>

              <a
                href="https://instagram.com/klbooxhouse"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-foreground transition hover:text-primary"
              >
                <InstagramIcon className="size-4 text-primary" />
                @klbooxhouse
              </a>

              <a
                href="https://maps.app.goo.gl/ChVGQ79C2uB4sR1m8"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-foreground transition hover:text-primary"
              >
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                Find us on Google Maps
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-7 shadow-sm">
            <div>
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-4 font-serif text-lg font-semibold text-foreground">
                Read what students say about studying here
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Check recent reviews on Google before you visit, or leave one
                of your own after your first session.
              </p>
            </div>

            <a
              href="https://maps.app.goo.gl/ChVGQ79C2uB4sR1m8"
              target="_blank"
              rel="noreferrer"
              className={cn(
                'mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground',
                'shadow-lg shadow-primary/20 transition duration-150 hover:brightness-110 active:scale-[0.98]',
              )}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              See Google reviews
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row lg:px-12">
          <span>© {new Date().getFullYear()} KL Boox House Library. All rights reserved.</span>
          <span>Library for excellence — since July 2023</span>
        </div>
      </footer>
    </main>
  )
}