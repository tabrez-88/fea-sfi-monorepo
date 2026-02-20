'use client'

import { CirclePlus } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

interface ApplicationForm {
  fullName: string
  email: string
  phoneNumber: string
  subject: string
  portfolio: string
  coverLetter: string
  cvFile: File | null
}

export default function ApplicationForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ApplicationForm>({
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    portfolio: '',
    coverLetter: '',
    cvFile: null,
  })
  const [submitting, setSubmitting] = useState(false)

  function updateField(field: keyof ApplicationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, cvFile: file }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // Prepare FormData for future backend integration
    const formData = new FormData()
    formData.append('fullName', form.fullName)
    formData.append('email', form.email)
    formData.append('phoneNumber', form.phoneNumber)
    formData.append('subject', form.subject)
    formData.append('portfolio', form.portfolio)
    formData.append('coverLetter', form.coverLetter)
    if (form.cvFile) {
      formData.append('cvFile', form.cvFile)
    }

    // TODO: Connect to backend API
    // await fetch('/api/career/apply', { method: 'POST', body: formData })

    setSubmitting(false)
  }

  return (
    <div className="lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">
      <form
        onSubmit={handleSubmit}
        className="border border-border rounded-2xl p-6 flex flex-col gap-5"
      >
        <div>
          <h3 className="font-bold text-lg">Submit Your Application</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your CV and fill up this form to apply for this role
          </p>
        </div>

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-bold">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Enter your full name"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phoneNumber" className="text-sm font-bold">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={form.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject" className="text-sm font-bold">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Enter the subject of your application"
            value={form.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Portfolio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="portfolio" className="text-sm font-bold">
            Portfolio
          </label>
          <input
            id="portfolio"
            name="portfolio"
            type="url"
            placeholder="Enter your portfolio link"
            value={form.portfolio}
            onChange={(e) => updateField('portfolio', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* CV Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold">Legal Filing Document</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:bg-muted transition-colors"
          >
            <CirclePlus className="size-6 text-muted-foreground" />
            <p className="text-sm font-bold">Upload your CV</p>
            <p className="text-xs text-muted-foreground">
              Click or drop your CV here to upload
            </p>
            <p className="text-xs text-muted-foreground">Supported formats: PDF</p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="cvFile"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {form.cvFile && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {form.cvFile.name}
            </p>
          )}
        </div>

        {/* Cover Letter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coverLetter" className="text-sm font-bold">
            Cover letter
          </label>
          <textarea
            id="coverLetter"
            name="coverLetter"
            rows={4}
            placeholder="Write your cover letter"
            value={form.coverLetter}
            onChange={(e) => updateField('coverLetter', e.target.value)}
            className="border border-border rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  )
}
