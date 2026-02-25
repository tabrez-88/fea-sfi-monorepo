import ApplicationForm from '@/components/Career/ApplicationForm'
import JobDetailInfo from '@/components/Career/JobDetailInfo'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'

const jobDetails = {
  type: 'Remote',
  title: 'Backend Engineer – Settlement & Financial Systems',
  department: 'Engineering',
  location: 'Remote (Preferred overlap with UTC ±3)',
  employmentType: 'Full-Time',
  reportsTo: 'Head of Engineering',
}

const roleOverview = [
  'FEA is building regulated infrastructure that enables transparent revenue participation across entertainment projects. At the core of this system is our settlement and allocation engine — responsible for ingesting revenue data, applying contractual allocation logic, and generating accurate payout records.',
  'As a Backend Engineer focused on Settlement & Financial Systems, you will design and maintain the systems that power revenue ingestion, allocation calculations, payout processing, and audit logging.',
  'This role requires precision, systems thinking, and a strong understanding of financial data integrity.',
]

const whatYouWillBuild = [
  'Design scalable backend services for revenue and payout workflows',
  'Implement deterministic allocation algorithms based on contractual rules',
  'Ensure financial data integrity across services',
  'Develop APIs consumed by investor dashboards and reporting modules',
  'Collaborate with legal/compliance to translate regulatory constraints into system logic',
]

const requiredQualifications = [
  '5+ years of backend engineering experience',
  'Strong proficiency in a backend language (e.g., Go, Python, Node.js, or similar)',
  'Experience designing financial or transactional systems',
]

const compensationBenefits = [
  'Competitive salary (based on experience and location)',
  'Equity participation (if applicable)',
  'Remote-first environment',
  'Flexible time off policy',
  'Health benefits (where applicable)',
]

const whatWeValue = [
  'Precision over speed',
  'Systems thinking over patchwork solutions',
  'Clear documentation',
  'Ownership and accountability',
]

const infoRows = [
  { label: 'Department:', value: jobDetails.department },
  { label: 'Location:', value: jobDetails.location },
  { label: 'Employment Type:', value: jobDetails.employmentType },
  { label: 'Reports To:', value: jobDetails.reportsTo },
]

const listSections = [
  { title: 'What You Will Build', items: whatYouWillBuild },
  { title: 'Required Qualifications', items: requiredQualifications },
  { title: 'Compensation & Benefits', items: compensationBenefits },
  { title: 'What We Value in This Role', items: whatWeValue },
]

export default function CareerDetailPage() {
  return (
    <div>
      <Container orientation="vertical">
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-bold uppercase">{jobDetails.type}</p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
            {jobDetails.title}
          </h1>
        </section>

        <section className="flex flex-col lg:flex-row gap-10 items-start">
          <JobDetailInfo
            infoRows={infoRows}
            roleOverview={roleOverview}
            sections={listSections}
          />
          <ApplicationForm />
        </section>
      </Container>
      <Banners />
    </div>
  )
}
