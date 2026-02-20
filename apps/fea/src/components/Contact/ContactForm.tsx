import { Button } from '@/components/ui/button'

export interface ContactFormProps {
  title: React.ReactNode
  subjects: string[]
}

export default function ContactForm({ title, subjects }: ContactFormProps) {
  return (
    <section id="contact-form" className="flex flex-col gap-6">
      <p className="text-xl lg:text-2xl font-extralight leading-relaxed max-w-2xl">
        {title}
      </p>

      <form className="border border-border rounded-2xl p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className="text-sm font-bold">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            className="border border-border rounded-lg px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
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
            className="border border-border rounded-lg px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-sm font-bold">
            Subject
          </label>
          <select
            id="subject"
            defaultValue="Partnership"
            className="border border-border rounded-lg px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring appearance-none"
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-bold">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder="How can we help you"
            className="border border-border rounded-lg px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-xl">
          Send Message
        </Button>
      </form>
    </section>
  )
}
