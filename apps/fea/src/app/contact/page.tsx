import ContactForm from '@/components/Contact/ContactForm'
import ContactHero from '@/components/Contact/ContactHero'
import ContactInfoCards, { ContactInfoItem } from '@/components/Contact/ContactInfoCards'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'

const contactInfo: ContactInfoItem[] = [
  { icon: 'mail', title: 'Email', value: 'hellofea.ask@funkyland.io' },
  { icon: 'phone', title: 'Phone', value: '+1 (888) 888-8888' },
  { icon: 'map-pin', title: 'Address', value: 'Elgin St. Celina, Delaware 299' },
]

const subjects = ['Partnership', 'General Inquiry', 'Project Proposal', 'Support', 'Other']

export default function ContactPage() {
  return (
    <Container>
      <ContactHero
        subtitle="Contact FEA"
        title={
          <>
            Start a <span className="font-bold">conversation</span> with our team
          </>
        }
        description="Have a question, partnership inquiry, or project proposal? We'd like to hear from you."
        ctaHref="#contact-form"
        ctaLabel="Send a Message"
        heroImage="/assets/studio2.jpg"
      />
      <ContactInfoCards items={contactInfo} />
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
    </Container>
  )
}
