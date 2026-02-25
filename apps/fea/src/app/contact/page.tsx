import ContactForm from '@/components/Contact/ContactForm'
import ContactHero from '@/components/Contact/ContactHero'
import Banners from '@/components/shared/Banners'
import { Separator } from '@/components/ui/separator'

const subjects = ['Partnership', 'General Inquiry', 'Project Proposal', 'Support', 'Other']

export default function ContactPage() {
  return (
    <div>
      <ContactHero
        subtitle="Contact FEA"
        title={
          <>
            Start a <span className="font-bold">conversation</span> with our team
          </>
        }
        description="Have a question, partnership inquiry, or project proposal? We'd like to hear from you."
        ctaHref="#contact-form"
        heroImage="/assets/studio2.jpg"
      />
      <Separator />
      <ContactForm
        title={
          <>
            Contact the <span className="font-bold">FEA</span> team for general inquiries,
            partnerships, or other questions. We&apos;ll review your message and follow up shortly.
          </>
        }
        subjects={subjects}
      />
      <Banners />
    </div>
  )
}
