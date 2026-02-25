'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import Container from '../shared/Container'

export interface ContactFormProps {
  title: React.ReactNode
  subjects: string[]
}

export default function ContactForm({ title, subjects }: ContactFormProps) {
  return (
    <Container orientation='vertical'>
      <p className="text-xl lg:text-[32px] font-light leading-tight">
        {title}
      </p>

      <form className="border border-border rounded-md p-6 lg:p-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className="text-sm font-bold">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            className="border border-border rounded-md px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-bold">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email address"
            className="border border-border rounded-md px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">
            Subject
          </label>
          <Select defaultValue="Partnership">
            <SelectTrigger size="lg" className="w-full border-border ">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-bold">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder="How can we help you"
            className="border border-border rounded-md px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-md">
          Send Message
        </Button>
      </form>
    </Container>
  )
}
