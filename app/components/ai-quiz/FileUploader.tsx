'use client'

import { useRef, useState } from 'react'
import { FileText, Image, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']
const acceptedExtensions = '.pdf,.jpg,.jpeg,.png'

export function FileUploader({ onFile }: { onFile: (file: File | null) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (!acceptedTypes.includes(candidate.type) || candidate.size > 10 * 1024 * 1024) {
      setError('Choose a PDF, JPG, JPEG, or PNG file smaller than 10 MB.')
      return
    }
    setError('')
    setFile(candidate)
    onFile(candidate)
  }

  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]) }}
        className={cn('rounded-2xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-6 text-center transition hover:border-primary/50 sm:p-10', file && 'border-solid')}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex min-w-0 items-center gap-3">
              {file.type === 'application/pdf' ? <FileText className="size-8 shrink-0 text-primary" /> : <Image className="size-8 shrink-0 text-primary" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button type="button" onClick={() => { setFile(null); onFile(null) }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Remove file">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto size-8 text-primary" aria-hidden="true" />
            <p className="mt-3 font-semibold">Drag and drop your study material here</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, JPEG or PNG · up to 10 MB</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110">
              Browse files
            </button>
            <input ref={inputRef} type="file" accept={acceptedExtensions} className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
